import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";

const Inbox = ({ onSelectUser, selectedUser }) => {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      setCurrentUser({
        id: userData.userId,
        name: userData.fullname
      });
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = onSnapshot(collection(db, "supportChats"), async (snapshot) => {
      const chatList = [];

      for (const chatDoc of snapshot.docs) {
        const chatData = chatDoc.data();
        const lastMsg = chatData.lastMessage;

        const participants = chatDoc.id.split("_");
        const otherUserId = participants.find(id => id !== currentUser.id);

        if (!otherUserId) continue;

        const userDoc = await getDoc(doc(db, "users", otherUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Determine what to show for last message
          let lastMessageContent = "No messages yet";
          if (lastMsg) {
            if (lastMsg.text) {
              lastMessageContent = lastMsg.text;
            } else if (lastMsg.mediaType.includes('image')) {
              lastMessageContent = "📷 Image";
            } else if (lastMsg.mediaType.includes('video')) {
              lastMessageContent = "🎥 Video";
            } 
          }

          chatList.push({
            userId: otherUserId,
            name: userData.fullname,
            image: userData.profilePhoto,
            lastText: lastMessageContent,
            time: lastMsg?.createdAt?.toDate().toLocaleString() || "",
            id: `${otherUserId}_${currentUser.id}`,
          });
        }
      }

      setChats(chatList);
      setFilteredChats(chatList); // Initialize filtered chats with all chats
    });

    return () => unsubscribe(); // clean-up
  }, [currentUser]);

  // Filter chats based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter(chat => 
        chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.lastText.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [searchTerm, chats]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="inbox">
      <h3>Messages</h3>
      <div className="inner-inbox">
        <input
          type="text"
          placeholder="Search Messages"
          className="searchInput"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      <ul>
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <li
              key={chat.userId}
              className={selectedUser?.id === chat.userId ? "active" : ""}
              onClick={() => onSelectUser(chat)}
            >
              <div className="user">
                <div className="avatar">
                 <img
  src={chat.image || "https://firebasestorage.googleapis.com/v0/b/image-to-url-converter-9483c.appspot.com/o/anonymous%40gmail.com%20%2B%201753085191639?alt=media&token=624cdeae-8142-4d5d-abca-42de7710a6d0"}
  alt="avatar"
  className="avatar"
/>

                </div>
                <div className="user-info">
                  <div className="names">{chat.name}</div>
                  <div className="msg">
                    {chat.lastText}
                  </div>
                </div>
              </div>
              <span className="time">{chat.time}</span>
            </li>
          ))
        ) : (
          <li className="no-chats">
            {searchTerm.trim() === "" ? "No support chats found" : "No messages match your search"}
          </li>
        )}
      </ul>
    </div>
  );
};

export default Inbox;