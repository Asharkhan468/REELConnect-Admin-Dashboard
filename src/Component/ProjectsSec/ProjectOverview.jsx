import React, { useEffect, useState } from "react";
import "./Project.css";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { LinearProgress } from "@mui/material";
import { useNavigate } from "react-router";
import AddTaskModal from "./AddTask";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
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
const ProjectOverview = (props) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [progress, setProgress] = useState();
  const navigate = useNavigate();
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [userNames, setUserNames] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    if (Array.isArray(props?.data?.tasks)) {
      const totalTasks = props.data.tasks.length;
      const completedTasks = props.data.tasks.filter(
        (task) => task.isChecked
      ).length;
      const calculatedProgress =
        totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      setProgress(calculatedProgress);
    }
  }, [props?.data?.tasks]);

  useEffect(() => {
    const fetchUserNames = async () => {
      const names = await Promise.all(
        props?.data?.joinedUsers.map(async (userId) => {
          const userRef = doc(db, "users", userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            return userSnap.data().fullname;
          } else {
            return "Unknown User";
          }
        })
      );
      setUserNames(names);
    };

    if (props?.data?.joinedUsers?.length > 0) {
      fetchUserNames();
    }
  }, [props?.data?.joinedUsers]);
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const addTaskToProject = async (newTask) => {
    try {
      const projectRef = doc(db, "projects", props.data.id); // Document reference

      await updateDoc(projectRef, {
        tasks: arrayUnion(newTask),
      });

      console.log("✅ Task added successfully");
    } catch (error) {
      console.error("❌ Error adding task: ", error);
    }
  };

  const handleAddTask = (newTask) => {
    addTaskToProject(newTask);
  };

  const handleCheckboxChange = async (taskId) => {
    try {
      // Find the task from props.data.tasks
      const task = props.data.tasks.find((item) => item.id === taskId);

      if (!task) return;

      // Toggle value
      const updatedValue = !task.isChecked;

      // Reference to the document in Firestore (assuming your document ID is props.data.id)
      const docRef = doc(db, "projects", props.data.id);

      // Update the tasks array
      const updatedTasks = props.data.tasks.map((item) =>
        item.id === taskId ? { ...item, isChecked: updatedValue } : item
      );

      // Update in Firestore
      await updateDoc(docRef, {
        tasks: updatedTasks,
      });
    } catch (error) {
      console.error("Error updating checkbox:", error);
    }
  };

  const handleReassign = async (taskId, newAssignee) => {
    try {
      const taskIndex = props.data.tasks.findIndex(
        (item) => item.id === taskId
      );

      if (taskIndex === -1) return;

      const updatedTasks = [...props.data.tasks];

      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        assignedTo: newAssignee,
      };

      const docRef = doc(db, "projects", props.data.id);

      await updateDoc(docRef, {
        tasks: updatedTasks,
      });
    } catch (error) {
      console.error("Error reassigning task:", error);
    }
  };
  return (
    <div>
      <button onClick={handleOpen}> {props.viewFilm}</button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            <div className="overview-container">
              <div className="xmark">
                <p>Overview</p>
                <FontAwesomeIcon
                  onClick={handleClose}
                  className="xmarks"
                  icon={faXmark}
                />
              </div>
              <div className="overview-content">
                <p className="p1">
                  <span>Project Overview</span>
                </p>
                <p className="p2"> {props?.data?.projectOverview}</p>
                <p className="p3">
                  <span>Roles : </span>
                  {props?.data?.role}
                </p>
                <p>
                  <span>Task : </span>
                  {props.data?.tasks?.length}
                </p>
                <p className="p4">
                  <span>Mentor / team info</span>
                </p>
                <p>
                  <span>{props?.data?.MentorORTeamInfo} : </span>Project Lead
                </p>
                <p className="p5">
                  <span>Progress Tracker</span>
                </p>
                <div className="trackers">
                  <Box sx={{ width: "100%", position: "relative" }}>
                    <LinearProgress
                      className="tracker"
                      variant="determinate"
                      value={progress}
                      sx={{
                        marginTop: "15px",
                        padding: "3px",
                        borderRadius: "50px",
                        width: {
                          xs: "65%",
                          sm: "70%",
                          md: "75%",
                        },
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        right: {
                          xs: "10px",
                          sm: "10px",
                          md: "30px",
                          lg: "45px",
                        },
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 500,
                          margin: 0,
                          fontFamily: "poppins",
                        }}
                      >
                        {Math.round(progress)}%
                      </p>
                    </Box>
                  </Box>
                </div>

                <p className="p6">
                  <span>Task list</span>
                </p>
                <div className="task-list">
                  <div>
                    {Array.isArray(props?.data?.tasks) &&
                      props.data.tasks.map((item) => (
                        <div
                          className="checkbox"
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            position: "relative",
                            gap: "8px", // Better spacing between elements
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={item.isChecked}
                            onChange={() => handleCheckboxChange(item.id)}
                          />
                          <p
                            className="p7"
                            style={{
                              margin: 0,
                              flexGrow: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span>{item.assignedTo} </span>
                            {item.taskName}
                          </p>
                          <div
                            className="dropdown-container"
                            style={{
                              flexShrink: 0,
                              paddingRight: "50px",
                              position: "relative",
                            }}
                          >
                            <button
                              className="dropdown-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(
                                  openDropdown === item.id ? null : item.id
                                );
                              }}
                              style={{
                                padding: "4px 8px",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M6 9l6 6 6-6" />
                              </svg>
                            </button>
                            <div
                              className="dropdown-menu"
                              style={{
                                display:
                                  openDropdown === item.id ? "block" : "none",
                                right: "50px",
                                width: "max-content",
                                minWidth: "150px",
                                maxWidth: "200px",
                              }}
                            >
                              {userNames.map((member) => (
                                <div
                                  key={member}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReassign(item.id, member);
                                    setOpenDropdown(null);
                                  }}
                                  className="dropdown-item"
                                  style={{
                                    padding: "8px 12px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    fontSize: "14px",
                                    lineHeight: "1.4",
                                    whiteSpace: "nowrap",
                                    cursor: "pointer",
                                    transition: "background-color 0.2s",
                                    backgroundColor: "#f0f0f0",
                                    zIndex: 999,
                                    position: "relative",
                                  }}
                                >
                                  {member}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="button-sec">
                    {/* <button>Start Task</button> */}
                   
                      <button
                        onClick={() => {
                          navigate("/GroupChatPage", {
                            state: { id: props.data.id },
                          });
                        }}
                      >
                        Message Team
                      </button>
                    
                  </div>
                  <div className="button-Sec">
                    <button
                      onClick={() => {
                        setAddTaskModalOpen(true);
                        setOpen(false);
                      }}
                    >
                      Add New Task
                    </button>
                    <br />
                    <button
                      onClick={() => {
                        handleClose();
                        navigate("/showcaseFilm");
                      }}
                    >
                      Show Case Film
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}></Typography>
        </Box>
      </Modal>

      <AddTaskModal
        open={addTaskModalOpen}
        onClose={() => setAddTaskModalOpen(false)}
        onAddTask={handleAddTask}
        user={userNames}
      />
    </div>
  );
};

export default ProjectOverview;
