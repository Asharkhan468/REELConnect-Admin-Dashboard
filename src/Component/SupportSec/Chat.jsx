import React, { useEffect, useState, useRef } from "react";
import "./Support.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCamera,
  faPaperPlane,
  faSpinner,
  faPlay,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { db, storage } from "../../firebaseConfig";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import InfiniteScroll from "react-infinite-scroll-component";

const Chat = ({ selectedUser, onBack, isMobile }) => {
  const [messages, setMessages] = useState([]);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const messagesContainerRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const initialLoad = useRef(true);
  const messagesEndRef = useRef(null); // Added this missing ref

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      setCurrentUser({
        id: userData.userId,
        name: userData.fullname,
      });
    }

    // Clean up listener on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const fetchMessages = async (loadMore = false) => {
    if (!selectedUser?.id) return;

    try {
      const messagesRef = collection(
        db,
        "supportChats",
        selectedUser.id,
        "messages"
      );
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

    if (selectedUser?.id) {
      fetchMessages();
    }
  }, [selectedUser]);

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

  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if (!text && !mediaFile) return;
    if (!selectedUser?.id || !currentUser?.id) return;

    setIsUploading(true);

    try {
      let messageData = {
        senderId: currentUser.id,
        createdAt: serverTimestamp(),
      };

      if (mediaFile) {
        const timestamp = Date.now();
        const fileName = mediaFile.name
          ? mediaFile.name.replace(/\.[^/.]+$/, "")
          : `file-${timestamp}`;
        const fileExtension = mediaFile.name
          ? mediaFile.name.split(".").pop()
          : mediaFile.type.split("/")[1] || "bin";

        const storageRef = ref(
          storage,
          `supportChats/${selectedUser.id}/media/${timestamp}_${fileName}.${fileExtension}`
        );
        await uploadBytes(storageRef, mediaFile);
        const mediaUrl = await getDownloadURL(storageRef);

        messageData = {
          ...messageData,
          mediaUrl,
          mediaType: mediaFile.type,
        };

        if (mediaFile.type.includes("video")) {
          try {
            const thumbnailBlob = await generateThumbnail(mediaFile);
            if (thumbnailBlob) {
              const thumbnailRef = ref(
                storage,
                `supportChats/${selectedUser.id}/thumbnails/${timestamp}_${fileName}.jpg`
              );
              await uploadBytes(thumbnailRef, thumbnailBlob);
              messageData.thumbnailUrl = await getDownloadURL(thumbnailRef);
            }
          } catch (thumbnailError) {
            console.error("Error generating thumbnail:", thumbnailError);
          }
        }
      } else if (text) {
        messageData.text = text;
      }

      const messagesRef = collection(
        db,
        "supportChats",
        selectedUser.id,
        "messages"
      );
      await addDoc(messagesRef, messageData);

      await updateDoc(doc(db, "supportChats", selectedUser.id), {
        lastMessage: {
          ...messageData,
          type: mediaFile ? "media" : "text",
          createdAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      // Scroll to bottom after sending message
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsUploading(false);
      setNewMessage("");
      setMediaFile(null);
      setMediaPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleMediaClick = (media) => {
    setFullscreenMedia(media);
  };

  const closeFullscreen = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setFullscreenMedia(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMediaFile(file);

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
      const videoUrl = URL.createObjectURL(file);
      const thumbnail = await generateThumbnail(file);
      setMediaPreview({
        url: videoUrl,
        type: file.type,
        thumbnail: thumbnail,
      });
    }
  };

  const generateThumbnail = (file) => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("video/")) {
        resolve("");
        return;
      }

      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      video.src = URL.createObjectURL(file);
      video.addEventListener("loadedmetadata", () => {
        canvas.width = 200;
        canvas.height = (200 / video.videoWidth) * video.videoHeight;
        video.currentTime = 1;
      });

      video.addEventListener("seeked", () => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          const thumbnailRef = ref(storage, `thumbnails/${uuidv4()}.jpg`);
          uploadBytes(thumbnailRef, blob).then((snapshot) => {
            getDownloadURL(snapshot.ref).then(resolve);
          });
        }, "image/jpeg");
      });
    });
  };

  const cancelMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderMessageContent = (message) => {
    if (message.mediaType && message.mediaUrl) {
      if (message.mediaType.startsWith("image")) {
        return (
          <div className="media-container">
            <img
              src={message.mediaUrl}
              alt="Media"
              className="message-media"
              loading="lazy"
              onClick={() =>
                handleMediaClick({
                  mediaUrl: message.mediaUrl,
                  mediaType: message.mediaType,
                })
              }
              style={{ cursor: "pointer" }}
            />
          </div>
        );
      } else if (message.mediaType.startsWith("video")) {
        return (
          <div
            onClick={() =>
              handleMediaClick({
                mediaUrl: message.mediaUrl,
                mediaType: message.mediaType,
              })
            }
            className="video-container"
          >
            {message.thumbnailUrl && message.mediaUrl && (
              <>
                <video
                  className="media-content"
                  preload="metadata"
                  poster={message.thumbnailUrl || undefined}
                >
                  <source src={`${message.mediaUrl}#t=0.5`} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="video-play-icon">
                  <FontAwesomeIcon icon={faPlay} />
                </div>
              </>
            )}
          </div>
        );
      }
    }
    return <p className="message-text">{message.text}</p>;
  };

  if (!selectedUser) {
    return (
      <div className="chat-empty">
        <p>Select a conversation</p>
      </div>
    );
  }
  return (
    <div className="chat">
      {fullscreenMedia && (
        <div className="fullscreen-media-viewer" onClick={closeFullscreen}>
          <div
            className="fullscreen-media-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-fullscreen"
              onClick={(e) => {
                e.stopPropagation();
                closeFullscreen();
              }}
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

      <div className="chat-header">
        {isMobile && (
          <button className="back-button" onClick={onBack}>
            <FontAwesomeIcon className="left" icon={faArrowLeft} />
          </button>
        )}
        <div className="avatar">
          <img
            src={
              selectedUser.image ||
              "https://firebasestorage.googleapis.com/v0/b/image-to-url-converter-9483c.appspot.com/o/anonymous%40gmail.com%20%2B%201753085191639?alt=media&token=624cdeae-8142-4d5d-abca-42de7710a6d0"
            }
            alt="avatar"
            className="avatar"
          />
        </div>
        <div className="chat-name">{selectedUser.name}</div>
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
          {messages.length > 0 ? (
            [...messages].map((message) => (
              <div
                key={message.id}
                className={`message ${
                  message.senderId === currentUser.id ? "right" : "left"
                }`}
              >
                {renderMessageContent(message)}
                <div className="message-time">
                  {formatMessageTime(message.createdAt)}
                </div>
              </div>
            ))
          ) : (
            <p className="no-messages">No messages found for this user</p>
          )}
          <div ref={messagesEndRef} />
        </InfiniteScroll>
      </div>

      <div className="chat-footer">
        <button
          className="attachment-btn"
          onClick={triggerFileInput}
          disabled={uploading}
          aria-label="Attach file"
        >
          <FontAwesomeIcon icon={faCamera} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*"
          style={{ display: "none" }}
        />
        <input
          type="text"
          className="message-input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <button
          className="send-btn"
          onClick={handleSendMessage}
          disabled={uploading || (!newMessage.trim() && !mediaFile)}
          aria-label="Send message"
        >
          <FontAwesomeIcon
            icon={uploading ? faSpinner : faPaperPlane}
            spin={uploading}
          />
        </button>
      </div>
    </div>
  );
};

export default Chat;
