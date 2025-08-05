import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faXmark,
  faPlay,
  faCamera,
  faPaperPlane,
  faImage,
  faVideo,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useRef, useCallback } from "react";
import "./GroupChat.css";
import { useLocation } from "react-router-dom";
import { db } from "../../firebaseConfig";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  onSnapshot,
  getDocs,
  doc,
  limit,
  startAfter,
  getDoc,
  where,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const GroupChat = () => {
  // State declarations
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [participants, setParticipants] = useState([]);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Refs
  const fileInputRef = useRef(null);
  const mediaOptionsRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const initialLoad = useRef(true);

  const location = useLocation();
  const { id } = location.state || {};

  // Initialize current user
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      setCurrentUser({
        id: userData.userId,
        name: userData.fullname,
      });
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchParticipants = async () => {
    if (!id) return;

    try {
      const groupRef = doc(db, "projects", id);
      const groupDoc = await getDoc(groupRef);

      if (groupDoc.exists()) {
        const groupData = groupDoc.data();

        // If participants are stored as user IDs in the group document
        if (groupData.joinedUsers) {
          // Fetch each participant's details
          const participantsPromises = groupData.joinedUsers.map(
            async (userId) => {
              const userRef = doc(db, "users", userId);
              const userDoc = await getDoc(userRef);
              if (userDoc.exists()) {
                return {
                  senderId: userId,
                  ...userDoc.data(),
                };
              }
              return null;
            }
          );

          const participantsData = (
            await Promise.all(participantsPromises)
          ).filter(Boolean);
          setParticipants(participantsData);
        }

      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  const fetchMessages = async (loadMore = false) => {
    if (!id) return;

    try {
      const messagesRef = collection(db, "groupChats", id, "messages");
      let q;

      if (loadMore && lastVisible) {
        q = query(
          messagesRef,
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(15)
        );
      } else {
        q = query(messagesRef, orderBy("createdAt", "desc"), limit(15));
      }

      // For initial load, set up real-time listener
      if (!loadMore) {
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const newMessages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMessages(newMessages);
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          setHasMore(snapshot.docs.length >= 15);

          // Scroll to bottom only if it's a new message (not initial load)
          if (!initialLoad.current) {
            setTimeout(scrollToBottom, 100);
          }
        });

        // Store the unsubscribe function to clean up later
        unsubscribeRef.current = unsubscribe;
        initialLoad.current = false;
      }
      // For loading more messages (pagination), just do a one-time fetch
      else {
        const snapshot = await getDocs(q);
        if (snapshot.docs.length > 0) {
          const newMessages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMessages((prev) => [...prev, ...newMessages]);
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          setHasMore(snapshot.docs.length >= 15);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };
  useEffect(() => {
    // Reset initial load when user changes
    initialLoad.current = true;

    // Clean up previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    if (id) {
      fetchMessages();
      fetchParticipants();
    }
  }, [id]);

  const loadMoreMessages = () => {
    fetchMessages(true);
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  const formatMessageTime = (timestamp) => {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    return "";
  };

  // Get sender info
  const getSender = (senderId) => {
    return (
      participants.find((p) => p.senderId === senderId) || {
        fullname: "Unknown User",
        profilePhoto: "https://via.placeholder.com/150",
      }
    );
  };

  // Handle media click for fullscreen view
  const handleMediaClick = (media) => {
    setFullscreenMedia(media);
  };

  // Close fullscreen media viewer
  const closeFullscreen = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setFullscreenMedia(null);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);

      // Create preview for the media
      if (file.type.includes("image")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setMediaPreview({
            url: event.target.result,
            type: file.type,
          });
        };
        reader.readAsDataURL(file);
      } else if (file.type.includes("video")) {
        const video = document.createElement("video");
        const url = URL.createObjectURL(file);

        video.onloadedmetadata = () => {
          setMediaPreview({
            url: url,
            type: file.type,
            thumbnail: null,
          });

          // Generate thumbnail
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              const thumbnailUrl = URL.createObjectURL(blob);
              setMediaPreview((prev) => ({
                ...prev,
                thumbnail: thumbnailUrl,
              }));
            },
            "image/jpeg",
            0.8
          );
        };

        video.src = url;
      }
    }
  };

  // Cancel media selection
  const cancelMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Generate video thumbnail
  const generateVideoThumbnail = (videoFile) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      video.src = URL.createObjectURL(videoFile);
      video.addEventListener("loadedmetadata", () => {
        const aspectRatio = video.videoWidth / video.videoHeight;
        const maxWidth = 400;
        canvas.width = Math.min(video.videoWidth, maxWidth);
        canvas.height = canvas.width / aspectRatio;
        video.currentTime = Math.min(0.25 * video.duration, 1);
      });

      video.addEventListener("seeked", () => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            resolve(blob);
            URL.revokeObjectURL(video.src);
          },
          "image/jpeg",
          0.8
        );
      });

      video.addEventListener("error", () => {
        resolve(null);
        URL.revokeObjectURL(video.src);
      });
    });
  };

  // Send message handler with optimistic update

  const handleSendMessage = async () => {
    const text = message.trim();
    if (!text && !mediaFile) return;

    setIsUploading(true);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempId,
      senderId: currentUser.id,
      text: text,
      createdAt: new Date(),
      isOptimistic: true,
    };

    setMessages((prev) => [newMessage, ...prev]);
    setMessage("");
    scrollToBottom();

    try {
      let mediaUrl = null;
      let mediaType = null;
      let thumbnailUrl = null;

      // Only process media if mediaFile exists
      if (mediaFile) {
        const storage = getStorage();
        const timestamp = Date.now();

        // Safely get file name and extension
        const fileName = mediaFile.name
          ? mediaFile.name.replace(/\.[^/.]+$/, "")
          : `file-${timestamp}`;
        const fileExtension = mediaFile.name
          ? mediaFile.name.split(".").pop()
          : mediaFile.type.split("/")[1] || "bin";

        const storageRef = ref(
          storage,
          `groupChats/${id}/media/${timestamp}_${fileName}.${fileExtension}`
        );
        await uploadBytes(storageRef, mediaFile);
        mediaUrl = await getDownloadURL(storageRef);
        mediaType = mediaFile.type;

        if (mediaFile.type.includes("video")) {
          try {
            const thumbnailBlob = await generateVideoThumbnail(mediaFile);
            if (thumbnailBlob) {
              const thumbnailRef = ref(
                storage,
                `groupChats/${id}/thumbnails/${timestamp}_${fileName}.jpg`
              );
              await uploadBytes(thumbnailRef, thumbnailBlob);
              thumbnailUrl = await getDownloadURL(thumbnailRef);
            }
          } catch (thumbnailError) {
            console.error("Error generating thumbnail:", thumbnailError);
            // Continue without thumbnail if there's an error
          }
        }
      }

      // Send to Firebase
      const messagesRef = collection(db, "groupChats", id, "messages");
      const docRef = await addDoc(messagesRef, {
        senderId: currentUser.id,
        text: text,
        createdAt: serverTimestamp(),
        ...(mediaUrl && { mediaUrl, mediaType }),
        ...(thumbnailUrl && { thumbnailUrl }),
      });

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
                ...msg,
                id: docRef.id,
                isOptimistic: false,
                ...(mediaUrl && { mediaUrl, mediaType }),
                ...(thumbnailUrl && { thumbnailUrl }),
              }
            : msg
        )
      );

      // Reset media state
      setMediaFile(null);
      setMediaPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message if failed
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));

      // Show error to user (optional)
      alert("Failed to send message. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

 

  // Handle key press for sending messages
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Toggle media options menu
  const toggleMediaOptions = () => {
    setShowMediaOptions(!showMediaOptions);
  };

  return (
    <div className="group-chat-container">
      {/* Fullscreen media viewer */}
      {fullscreenMedia && (
        <div className="fullscreen-media-viewer" onClick={closeFullscreen}>
          <div
            className="fullscreen-media-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-fullscreen"
              onClick={closeFullscreen}
              aria-label="Close media viewer"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            {fullscreenMedia.mediaType.includes("image") ? (
              <img src={fullscreenMedia.mediaUrl} alt="Fullscreen content" />
            ) : (
              <video controls autoPlay>
                <source
                  src={fullscreenMedia.mediaUrl}
                  type={fullscreenMedia.mediaType}
                />
              </video>
            )}
          </div>
        </div>
      )}

      {/* Media preview before sending */}
      {mediaPreview && (
        <div className="media-preview-fullscreen">
          <div className="media-preview-container">
            <button className="close-preview" onClick={cancelMedia}>
              <FontAwesomeIcon icon={faXmark} />
            </button>

            <div className="media-preview-content">
              {mediaPreview.type.includes("image") ? (
                <img src={mediaPreview.url} alt="Preview" />
              ) : (
                <div className="video-preview">
                  <video controls src={mediaPreview.url} />
                </div>
              )}
            </div>

            <div className="preview-actions">
              <button className="cancel-button" onClick={cancelMedia}>
                Cancel
              </button>
              <button
                className="send-preview-btn"
                onClick={handleSendMessage}
                disabled={isUploading}
              >
                {isUploading ? <div className="spinner"></div> : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="group-chat">
        <div className="group-chat-header">
          {isMobile && (
            <button className="back-button">
              <FontAwesomeIcon className="left" icon={faArrowLeft} />
            </button>
          )}

          <div className="participants-avatars">
            {participants.slice(0, 3).map((participant) => (
              <div key={participant.senderId} className="participant-avatar">
                <img
                  src={
                    participant.profilePhoto ||
                  "https://firebasestorage.googleapis.com/v0/b/image-to-url-converter-9483c.appspot.com/o/anonymous%40gmail.com%20%2B%201753085191639?alt=media&token=624cdeae-8142-4d5d-abca-42de7710a6d0"
                  }
                  alt={participant.fullname}
                />
              </div>
            ))}
            {participants.length > 3 && (
              <div className="more-participants">
                +{participants.length - 3}
              </div>
            )}
          </div>

          <div className="group-info">
            <div className="group-name">Group Chat</div>
            <div className="group-members">{participants.length} members</div>
          </div>
        </div>

        <div
          id="scrollableDiv"
          ref={messagesContainerRef}
          className="chat-body"
          style={{
            overflow: "auto",
            display: "flex",
            flexDirection: "column-reverse",
          }}
        >
          <InfiniteScroll
            dataLength={messages.length}
            next={loadMoreMessages}
            style={{ display: "flex", flexDirection: "column-reverse" }}
            inverse={true}
            hasMore={hasMore}
            loader={
              <div className="loading-messages">
                <FontAwesomeIcon icon={faSpinner} spin />
              </div>
            }
            scrollableTarget="scrollableDiv"
          >
            {messages && messages.length > 0 ? (
              [...messages].map((msg) => {
                const sender = getSender(msg.senderId);
                const isYou = msg.senderId === currentUser?.id;

                return (
                  <div
                    key={msg.id}
                    className={`message-container msg-top ${
                      isYou ? "right" : "left"
                    }`}
                  >
                    {!isYou && (
                      <div className="message-avatar">
                        <img
                          src={
                            sender.profilePhoto ||
                            "https://via.placeholder.com/150"
                          }
                          alt={sender.fullname}
                        />
                      </div>
                    )}

                    <div className="message-content">
                      {!isYou && (
                        <div className="message-sender">
                          <span className="sender-name">{sender.fullname}</span>
                        </div>
                      )}

                      <div
                        className={`message-bubble ${isYou ? "you" : "other"}`}
                      >
                        {msg.mediaUrl && (
                          <div
                            className="message-media"
                            onClick={() =>
                              handleMediaClick({
                                mediaUrl: msg.mediaUrl,
                                mediaType: msg.mediaType,
                              })
                            }
                          >
                            {msg.mediaType.includes("image") ? (
                              <img
                                src={msg.mediaUrl}
                                alt="Shared content"
                                className="media-content"
                              />
                            ) : msg.mediaType.includes("video") ? (
                              <div className="video-container">
                                <video
                                  className="media-content"
                                  preload="metadata"
                                  poster={msg.thumbnailUrl || undefined}
                                >
                                  <source
                                    src={`${msg.mediaUrl}#t=0.5`}
                                    type="video/mp4"
                                  />
                                  Your browser does not support the video tag.
                                </video>
                                <div className="video-play-icon">
                                  <FontAwesomeIcon icon={faPlay} />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )}

                        {msg.text && (
                          <div className="message-text">{msg.text}</div>
                        )}

                        <div className="message-time">
                          {formatMessageTime(msg.createdAt)}
                          {isYou && msg.mediaUrl && (
                            <span className="media-type-icon">
                              {msg.mediaType.includes("image") ? (
                                <FontAwesomeIcon icon={faImage} />
                              ) : (
                                <FontAwesomeIcon icon={faVideo} />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="no-messages">No messages found for this user</p>
            )}
            <div ref={messagesEndRef} />
          </InfiniteScroll>
        </div>

        <div className="group-chat-footer">
          <div className="message-input-container">
            <div className="media-options-container" ref={mediaOptionsRef}>
              <button
                className="media-option-trigger"
                onClick={toggleMediaOptions}
              >
                <FontAwesomeIcon icon={faCamera} />
              </button>

              {showMediaOptions && (
                <div className="media-options-dropdown">
                  <label htmlFor="image-upload" className="media-option">
                    <FontAwesomeIcon icon={faImage} />
                    <span>Photo</span>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      style={{ display: "none" }}
                    />
                  </label>
                  <label htmlFor="video-upload" className="media-option">
                    <FontAwesomeIcon icon={faVideo} />
                    <span>Video</span>
                    <input
                      id="video-upload"
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              )}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows="1"
            />

            {!mediaPreview && (
              <button
                className={`send-button ${message.trim() ? "active" : ""}`}
                onClick={handleSendMessage}
                disabled={isUploading || !message.trim()}
              >
                {isUploading ? (
                  <div className="spinner"></div>
                ) : (
                  <FontAwesomeIcon icon={faPaperPlane} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;
