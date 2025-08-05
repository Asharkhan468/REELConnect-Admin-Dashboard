import React, { useState } from "react";
import ProjectsCard from "./ProjectsCard";
import "./Project.css";
import Cards from "./Cards";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useEffect } from "react";

const FilmCard = () => {
  const [projects, setProjects] = useState();

  //fetch all the projects from the backend
  useEffect(() => {
    const usersRef = collection(db, "showcasefilm");
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProjects(usersData);
      },
      (error) => {
        console.error("Error in real-time fetching:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="projects-container">
      {projects && projects.length !== 0 ? (
        <div className="poject-card-section">
          {projects.map((project) => (
            <ProjectsCard
              key={project.id}
              image={
                project.fileType !== 'image/jpeg' ?
                "https://firebasestorage.googleapis.com/v0/b/image-to-url-converter-9483c.appspot.com/o/nothanks%40gmail.com%20%2B%201751449410702?alt=media&token=7364e344-a333-4196-81f8-d06c9bc12ed3": project.fileUri
              }
              head={project.title}
              des={project.description}
              Date={project.createdAt?.toDate().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
              id={project.id}
              viewFilm="View Film"
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "40vh",
            fontFamily: "Poppins",
          }}
        >
          <p style={{ margin: 0 }}>No Project Available...</p>
        </div>
      )}
    </div>
  );
};

export default FilmCard;
