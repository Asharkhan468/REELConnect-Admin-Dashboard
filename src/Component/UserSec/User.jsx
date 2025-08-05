import React, { useEffect, useRef, useState } from "react";
import "./User.css";
import UserAddForm from "./UserAddForm";
import UserEditForm from "./UserEditForm";
import { Link } from "react-router";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { useSelector } from "react-redux";

const User = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  const dropdownRef = useRef(null);
  const search = useSelector((state) => state.search.setSearch);

  // Handle dropdown toggle
  const handleToggleDropdown = (index) => {
    setOpenDropdown(openDropdown === index ? null : index);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch users from Firestore
  useEffect(() => {
    const usersRef = collection(db, "users");

    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const usersData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((user) => user.role !== "admin");

        setUsers(usersData);
        setFilteredUsers(usersData); // Initialize with all users
      },
      (error) => {
        console.error("Error in real-time fetching:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter users based on search term
  useEffect(() => {
    if (!search || search.trim() === "") {
      // If search is empty, show all users
      setFilteredUsers(users);
    } else {
      // Filter users whose fullname contains the search term (case-insensitive)
      const searchTerm = search.toLowerCase();
      const filtered = users.filter((user) =>
        user.fullname.toLowerCase().includes(searchTerm)
      );
      setFilteredUsers(filtered);
    }
    setCurrentPage(1); // Always reset to first page when search changes
  }, [search, users]);

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Delete User by userId using Backend API
  const deleteUserById = async (uid) => {
    try {
      const res = await fetch(`https://reel-connect-admin-backend.vercel.app/delete-user/${uid}`, {
        method: "DELETE",
      });

      const data = await res.json();
      console.log(data.message);
    } catch (err) {
      console.error("Frontend Error:", err);
    }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setOpenEdit(true);
  };

  return (
    <>
      <div>
        <UserAddForm />
      </div>

      <div>
        <UserEditForm
          userData={editUser}
          open={openEdit}
          setOpen={setOpenEdit}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email Address</th>
              <th>Phone No</th>
              <th>User Type</th>
              <th>Student ID</th>
              <th></th>
            </tr>
          </thead>
          <tbody >
            {currentUsers.length > 0 ? (
              currentUsers.map((user, index) => (
                <tr key={index} >
                  <td data-label="Name">{user.fullname}</td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Phone No">{user.phone}</td>
                  <td data-label="User Type">{user.role}</td>
                  <td data-label="Student ID">{user.userId}</td>
                  <td data-label="Actions" className="actions-cell">
                    <span
                      className="dots"
                      onClick={() => handleToggleDropdown(index)}
                    >
                      ⋮
                    </span>
                    {openDropdown === index && (
                      <div className="dropdown" ref={dropdownRef}>
                        <button onClick={() => handleEdit(user)}>Edit</button>
                        <button onClick={() => deleteUserById(user.userId)}>
                          Delete
                        </button>
                        {/* <button>Accept</button>
                        <button>Decline</button> */}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
           <td colSpan="6">
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    No users found
  </div>
</td>


              </tr>
            )}
          </tbody>
        </table>

        {filteredUsers.length > usersPerPage && (
          <div className="pagination">
            <button
              className="prev"
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              ◀
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                className={`page ${currentPage === number ? "active" : ""}`}
                onClick={() => paginate(number)}
              >
                {number}
              </button>
            ))}

            <button
              className="next"
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              ▶
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default User;