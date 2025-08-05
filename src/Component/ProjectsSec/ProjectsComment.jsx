import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faThumbsUp,
  faMessage,
  faPaperPlane,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Fade from "@mui/material/Fade";
import "./Project.css";
import {
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: "none",
  border: "none",
  outline: "none",
};

const ProjectsComment = (props) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [comment, setComment] = useState([]);
  const [user, setUser] = useState();
  const [replyInputVisible, setReplyInputVisible] = useState({});
  const [replyText, setReplyText] = useState("");
  const [openReplies, setOpenReplies] = useState({});
  const [likedComments, setLikedComments] = useState({});
  const [animatingLikes, setAnimatingLikes] = useState({});
  const [dislikedComments, setDislikedComments] = useState({});
  const [animatingDislikes, setAnimatingDislikes] = useState({});

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const toggleReplyInput = (commentId) => {
    setReplyInputVisible((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const likeComment = async (postId, commentId, userId) => {
    if (!userId) return;

    const commentRef = doc(db, "showcasefilm", postId, "comments", commentId);
    const commentSnap = await getDoc(commentRef);
    const currentLikes = commentSnap.data()?.likes || [];
    const isCurrentlyLiked = currentLikes.includes(userId);

    setLikedComments((prev) => ({ ...prev, [commentId]: !isCurrentlyLiked }));
    setDislikedComments((prev) => ({ ...prev, [commentId]: false }));
    setAnimatingLikes((prev) => ({ ...prev, [commentId]: true }));

    try {
      const currentDislikes = commentSnap.data()?.dislikes || [];

      if (isCurrentlyLiked) {
        const updatedLikes = currentLikes.filter((id) => id !== userId);
        await updateDoc(commentRef, { likes: updatedLikes });
      } else {
        const updatedDislikes = currentDislikes.filter((id) => id !== userId);
        const updatedLikes = [...currentLikes, userId];

        await updateDoc(commentRef, {
          likes: updatedLikes,
          dislikes: updatedDislikes,
        });
      }
    } catch (error) {
      console.error("Error updating like:", error);
      setLikedComments((prev) => ({
        ...prev,
        [commentId]: isCurrentlyLiked,
      }));
    }

    setTimeout(
      () => setAnimatingLikes((prev) => ({ ...prev, [commentId]: false })),
      200
    );
  };
  const dislikeComment = async (postId, commentId, userId) => {
    if (!userId) return;

    const commentRef = doc(db, "showcasefilm", postId, "comments", commentId);
    const commentSnap = await getDoc(commentRef);
    const currentDislikes = commentSnap.data()?.dislikes || [];
    const isCurrentlyDisliked = currentDislikes.includes(userId);

    setDislikedComments((prev) => ({
      ...prev,
      [commentId]: !isCurrentlyDisliked,
    }));
    setLikedComments((prev) => ({ ...prev, [commentId]: false }));
    setAnimatingDislikes((prev) => ({ ...prev, [commentId]: true }));

    try {
      const currentLikes = commentSnap.data()?.likes || [];

      if (isCurrentlyDisliked) {
        const updatedDislikes = currentDislikes.filter((id) => id !== userId);
        await updateDoc(commentRef, { dislikes: updatedDislikes });
      } else {
        const updatedLikes = currentLikes.filter((id) => id !== userId);
        const updatedDislikes = [...currentDislikes, userId];

        await updateDoc(commentRef, {
          dislikes: updatedDislikes,
          likes: updatedLikes,
        });
      }
    } catch (error) {
      console.error("Error updating dislike:", error);
      setDislikedComments((prev) => ({
        ...prev,
        [commentId]: isCurrentlyDisliked,
      }));
    }

    setTimeout(
      () => setAnimatingDislikes((prev) => ({ ...prev, [commentId]: false })),
      200
    );
  };

  const toggleReplies = (postId) => {
    setOpenReplies((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleSend = () => {
    const commentData = {
      name: user.fullname,
      comment: message,
    };

    addCommentToCommentsCollection(props.id, commentData, user, setMessage);
  };

  const handleReplySend = (commentId) => {
    console.log("Reply to", commentId, "with:", replyText);
    addReplyToComment(props.id, commentId, replyText, user, setReplyText);
    setReplyInputVisible((prev) => ({
      ...prev,
      [commentId]: false,
    }));
  };

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    setShowSendButton(value.trim().length > 0);
    console.log(value.trim().length > 0);
  };

  const addCommentToCommentsCollection = async (
    postId,
    commentData,
    user,
    setMessage
  ) => {
    try {
      const commentsRef = collection(db, "showcasefilm", postId, "comments");

      await addDoc(commentsRef, {
        comment: commentData.comment || "",
        userId: user.userId || "",
        createdAt: serverTimestamp(),
        dislikes: [],
        likes: [],
      });

      console.log(" Comment added to subcollection successfully.");
      setMessage("");
    } catch (error) {
      console.error(" Error adding comment to subcollection:", error);
    }
  };

  const addReplyToComment = async (
    postId,
    commentId,
    replyData,
    user,
    setReplyMessage
  ) => {
    try {
      const repliesRef = collection(
        db,
        "showcasefilm",
        postId,
        "comments",
        commentId,
        "replies"
      );

      await addDoc(repliesRef, {
        comment: replyData,
        userId: user.userId || "",
        createdAt: serverTimestamp(),
      });

      console.log("✅ Reply added to subcollection successfully.");
      setReplyMessage("");
    } catch (error) {
      console.error("❌ Error adding reply to subcollection:", error);
    }
  };

  const getCommentsByPostIdWithReplies = async (postId, setComments) => {
    try {
      const commentsRef = collection(db, "showcasefilm", postId, "comments");
      const snapshot = await getDocs(commentsRef);

      if (snapshot.empty) {
        setComments([]);
        return;
      }

      const comments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const commentUserIds = [...new Set(comments.map((c) => c.userId))];

      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const repliesRef = collection(
            db,
            "showcasefilm",
            postId,
            "comments",
            comment.id,
            "replies"
          );
          const repliesSnapshot = await getDocs(repliesRef);

          const replies = repliesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          return { ...comment, replies };
        })
      );

      const replyUserIds = commentsWithReplies
        .flatMap((comment) => comment.replies.map((r) => r.userId))
        .filter(Boolean);

      const allUserIds = [...new Set([...commentUserIds, ...replyUserIds])];

      const userFetches = await Promise.all(
        allUserIds.map(async (userId) => {
          const userRef = doc(db, "users", userId);
          const userSnap = await getDoc(userRef);
          return { userId, ...userSnap.data() };
        })
      );

      // Create user map
      const userMap = {};
      userFetches.forEach((user) => {
        if (user.userId) {
          userMap[user.userId] = {
            name: user.fullname || "",
            profilePhoto: user.profilePhoto || "",
          };
        }
      });

      // Enrich comments and replies with user info
      const enrichedComments = commentsWithReplies.map((comment) => ({
        ...comment,
        userName: userMap[comment.userId]?.name || "",
        userPhoto: userMap[comment.userId]?.profilePhoto || "",
        replies: comment.replies.map((reply) => ({
          ...reply,
          userName: userMap[reply.userId]?.name || "",
          userPhoto: userMap[reply.userId]?.profilePhoto || "",
        })),
      }));

      setComments(enrichedComments);
    } catch (error) {
      console.error("🔥 Error fetching comments and replies:", error);
      setComments([]);
    }
  };

  getCommentsByPostIdWithReplies(props.id, setComment);

  const formatTime = (timestamp) => {
    if (!timestamp?.seconds) return "";

    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const secondsAgo = Math.floor((now - date) / 1000);

    if (secondsAgo < 60) return "Just now";
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    if (secondsAgo < 172800) return "Yesterday";
    if (secondsAgo < 604800) return `${Math.floor(secondsAgo / 86400)}d ago`;

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const userData = JSON.parse(storedUser);

      setUser(userData);
    } else {
      console.log("No user found in local storage.");
    }
  }, []);

  return (
    <div>
      <FontAwesomeIcon onClick={handleOpen} className="icon" icon={faMessage} />

      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Fade in={open}>
          <Box sx={style}>
            <Typography component="div">
              <div className="modal-container">
                <div className="modal-header">
                  <h2>Comments</h2>
                  <FontAwesomeIcon
                    onClick={handleClose}
                    className="close-icon"
                    icon={faXmark}
                  />
                </div>

                <div className="comments-list">
                  {comment.length === 0 ? (
                    <div className="no-comments">
                      <p>No comments yet. Be the first to comment!</p>
                    </div>
                  ) : (
                    comment.map((post) => (
                      <div key={post.id} className="comment-card">
                        <img
                          src={post.userPhoto}
                          alt={post.userName}
                          className="avatar"
                        />

                        <div className="comment-main-content">
                          <div className="comment-text-content">
                            <div className="comment-header">
                              <p className="comment-name">{post.userName}</p>
                              <div className="comment-actions">
                                <button
                                  className={`reaction-button like-button ${
                                    post.likes.includes(user.userId)
                                      ? "liked"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    likeComment(props.id, post.id, user.userId)
                                  }
                                >
                                  <FontAwesomeIcon icon={faThumbsUp } />
                                  <span
                                    className={`reaction-count ${
                                      animatingLikes[post.id] ? "changed" : ""
                                    }`}
                                  >
                                    {post.likes.length || 0}
                                  </span>
                                </button>

                                {/* <button
                                  className={`reaction-button dislike-button ${
                                    post.dislikes.includes(user.userId)
                                      ? "disliked"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    dislikeComment(
                                      props.id,
                                      post.id,
                                      user.userId
                                    )
                                  }
                                >
                                  <FontAwesomeIcon icon={faThumbsDown} />
                                  <span
                                    className={`reaction-count ${
                                      animatingDislikes[post.id]
                                        ? "changed"
                                        : ""
                                    }`}
                                  >
                                    {post.dislikes.length || 0}
                                  </span>
                                </button> */}
                              </div>
                            </div>

                            <p className="comment-message">{post.comment}</p>

                            <div className="comment-meta">
                              <span>{formatTime(post.createdAt)}</span>
                              {user.userId !== post.userId && (
                                <span
                                  className="reply-btn"
                                  onClick={() => toggleReplyInput(post.id)}
                                >
                                  Reply
                                </span>
                              )}
                            </div>

                            {replyInputVisible[post.id] && (
                              <div className="reply-input-box">
                                <input
                                  type="text"
                                  placeholder="Write a reply..."
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                />
                                {replyText.length > 0 && (
                                  <FontAwesomeIcon
                                    icon={faPaperPlane}
                                    onClick={() => handleReplySend(post.id)}
                                    className="send-icon"
                                  />
                                )}
                              </div>
                            )}

                            {post.replies.length !== 0 && (
                              <div
                                className="view-replies"
                                onClick={() => toggleReplies(post.id)}
                              >
                                {openReplies[post.id]
                                  ? "Hide replies ▲"
                                  : `View ${post.replies.length} replies ▼`}
                              </div>
                            )}

                            {openReplies[post.id] &&
                              post.replies.map((reply) => (
                                <div key={reply.id} className="reply-card">
                                  <img
                                    src={reply.userPhoto}
                                    alt={reply.userName}
                                    className="avatar"
                                  />
                                  <div className="reply-content">
                                    <div className="reply-header">
                                      <p className="comment-name">
                                        {reply.userName}
                                      </p>
                                    </div>
                                    <p className="comment-message">
                                      {reply.comment}
                                    </p>
                                    <div className="comment-meta">
                                      <span>{formatTime(reply.createdAt)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="send-message-box">
                  <input
                    type="text"
                    placeholder="Send Message"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleMessageChange;
                    }}
                  />
                  {message.length > 0 && (
                    <FontAwesomeIcon
                      onClick={handleSend}
                      className="send-icon"
                      icon={faPaperPlane}
                    />
                  )}
                </div>
              </div>
            </Typography>
          </Box>
        </Fade>
      </Modal>
    </div>
  );
};

export default ProjectsComment;
