import React from "react";
import "./Project.css";
import ProjectsComment from "./ProjectsComment";
import ProjectOverview from "./ProjectOverview";
import { db } from "../../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { useLocation } from "react-router";

const ProjectsCard = (props) => {
  const updateProjectStatus = async (projectId, newStatus) => {
    try {
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        status: newStatus,
      });
      console.log("Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const location = useLocation();

  return (
    <div className="project-card-container">
      <div className="card-container">
        <div className="card">
          <div className="cards">
            <div>
              <img src={props.image} alt="" />
            </div>
            <div className="description">
              <p className="project-head">{props.head}</p>
              <p className="project-des">{props.des} </p>
              <p className="project-date">
                Date: <span>{props.Date}</span>
              </p>
              <div className="comment">
                {location.pathname === "/projectsPage" && (
                  <ProjectOverview
                    viewFilm={props.viewFilm}
                    data={props.project}
                  />
                )}
                {location.pathname !== "/projectsPage" && (
                 <div style={{marginLeft:'3px'}}>
                   <ProjectsComment id={props.id} />
                 </div>
                )}
              </div>
            </div>
          </div>
          {props.status === "pending" && (
            <>
              <div className="buttons">
                <button onClick={() => updateProjectStatus(props.id, "active")}>
                  {props.Accept}
                </button>
                <button
                  className="decline"
                  onClick={() => updateProjectStatus(props.id, "moderate")}
                >
                  {props.Decline}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsCard;
