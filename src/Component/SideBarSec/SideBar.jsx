import "./SideBar.css";
import Swal from "sweetalert2";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router";
import { NavLink } from "react-router";

const SideBar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
  Swal.fire({
    title: "Are you sure?",
    text: "You will be logged out!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#808080",
    confirmButtonText: "Yes, logout!",
    cancelButtonText: "No, stay!",
    customClass: {
      popup: "poppins",
    },
  }).then((result) => {
    if (result.isConfirmed) {
      const auth = getAuth();
      signOut(auth)
        .then(() => {
          // Clear all user-related data from localStorage
          localStorage.removeItem("user");
          localStorage.removeItem("rememberMe");

          Swal.fire({
            position: "center",
            icon: "success",
            title: "Logged out successfully!",
            showConfirmButton: false,
            timer: 1500,
            customClass: {
              popup: "poppins",
            },
          });
          navigate("/");
        })
        .catch((error) => {
          Swal.fire({
            icon: "error",
            title: "Logout failed!",
            text: error.message,
            customClass: {
              popup: "poppins",
            },
          });
        });
    }
  });
};
  return (
    <div className="side-bar-container">
      <div className="logo">
        <img className="logos" src="/images/logos.svg" alt="Logo" />
      </div>

      <div className="inner">
        <div className="side-bar">
          <NavLink
            className={({ isActive }) => (isActive ? "link active" : "link")}
            to="/userPage"
          >
            <img src="/images/user.svg" alt="user" />
            <p>Users</p>
          </NavLink>
        </div>

        <div className="side-bar">
          <NavLink
            className={({ isActive }) => (isActive ? "link active" : "link")}
            to="/projectsPage"
          >
            <img src="/images/project.svg" alt="project" />
            <p>Projects</p>
          </NavLink>
        </div>

        <div className="side-bar">
          <NavLink
            className={({ isActive }) => (isActive ? "link active" : "link")}
            to="/coursePage"
          >
            <img src="/images/course.svg" alt="course" />
            <p className="side-bar-course-icon">Course</p>
          </NavLink>
        </div>

         <div className="side-bar-quiz">
          <NavLink
            className={({ isActive }) => (isActive ? "link active" : "link")}
            to="/QuizAdd"
          >
            <img src="/images/quiz.svg" alt="support" className="svg-quiz"/>
            <p className="side-bar-support-icon quiz-text">Quizes</p>
          </NavLink>
        </div>

        <div className="side-bar">
          <NavLink
            className={({ isActive }) => (isActive ? "link active" : "link")}
            to="/supportPage"
          >
            <img src="/images/support.svg" alt="support" />
            <p className="side-bar-support-icon">Support</p>
          </NavLink>
        </div>


       

        <div className="side-bar" onClick={handleLogout}>
          <img src="/images/logout.svg" alt="logout" />
          <p className="side-bar-logout">Logout</p>
        </div>
      </div>
    </div>
  );
};

export default SideBar;
