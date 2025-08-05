import React, { useState, useEffect } from "react";
import ProjectsCard from "./ProjectsCard";
import "./Project.css";
import {
  collection,
  query,
  where,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useSelector } from "react-redux";

const ActiveCard = ({ startDate, endDate }) => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const search = useSelector((state) => state.search.setSearch);

  useEffect(() => {
    let unsubscribe;

    const fetchProjects = () => {
      try {
        // Case 1: No dates - fetch all active projects
        if (!startDate && !endDate) {
          const q = query(
            collection(db, "projects"),
            where("status", "==", "active")
          );
          unsubscribe = onSnapshot(q, (snapshot) => {
            const projectsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
            }));
            setProjects(projectsData);
            setFilteredProjects(projectsData);
          });
          return;
        }

        // Case 2: Only start date - fetch projects for that specific day
        if (startDate && !endDate) {
          const date = new Date(startDate);
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);

          const q = query(
            collection(db, "projects"),
            where("status", "==", "active"),
            where("createdAt", ">=", Timestamp.fromDate(startOfDay)),
            where("createdAt", "<=", Timestamp.fromDate(endOfDay))
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            const projectsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
            }));
            setProjects(projectsData);
            setFilteredProjects(projectsData);
          });
          return;
        }

        // Case 3: Both dates - check each day in the range
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          start.setHours(0, 0, 0, 0); // Start of the day
          end.setHours(23, 59, 59, 999); // End of the day

          const q = query(
            collection(db, "projects"),
            where("status", "==", "active"),
            where("createdAt", ">=", Timestamp.fromDate(start)),
            where("createdAt", "<=", Timestamp.fromDate(end))
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            const projectsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
            }));
            setProjects(projectsData);
            setFilteredProjects(projectsData);
          });
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
        setFilteredProjects([]);
      }
    };

    fetchProjects();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [startDate, endDate]);

  // Filter projects based on search term
  useEffect(() => {
    if (!search || search.trim() === "") {
      // If search is empty, show all projects
      setFilteredProjects(projects);
    } else {
      // Filter projects whose name contains the search term (case-insensitive)
      const searchTerm = search.toLowerCase();
      const filtered = projects.filter((project) =>
        project.projectName.toLowerCase().includes(searchTerm)
      );
      setFilteredProjects(filtered);
    }
  }, [search, projects]);

  return (
    <>
      {filteredProjects.length > 0 ? (
        <div className="poject-card-section">
        {filteredProjects.map((project) => (
            <ProjectsCard
              key={project.id}
              image="/images/card.png"
              head={project.projectName}
              des={project.projectOverview}
              Date={project.createdAt.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
              viewFilm="View Film"
              status={project.status}
              id={project.id}
              project={project}
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
          <p style={{ margin: 0 }}>
            {projects.length === 0 ? "No Projects Found" : "No Matching Projects Found"}
          </p>
        </div>
      )}
    </>
  );
};

export default ActiveCard;