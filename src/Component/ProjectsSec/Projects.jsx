import React, { useState } from "react";
import "./Project.css";
import Cards from "./Cards";
import ActiveCard from "./ActiveCards";
import ModerateCard from "./ModerateCard";
import { useSelector } from "react-redux";

const Projects = () => {
  const [selectedTab, setSelectedTab] = useState("pending");
   const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");


  const user = useSelector((state) => state.user.currentUser);


   const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };


  return (
    <>
      <div className="projects-container">
        <div className="date">
          <div className="start-date">
            <p>Start Date</p>
            <input type="date" value={startDate} onChange={handleStartDateChange} />
          </div>
          <div className="end-date">
            <p>End Date</p>
            <input type="date" value={endDate} onChange={handleEndDateChange}  />
          </div>
        </div>
        <div className="select-btn gap-2">
          <button
            onClick={() => setSelectedTab("active")}
            className={selectedTab === "active" ? "active" : ""}
          >
            Active
          </button>
          <button
            onClick={() => setSelectedTab("pending")}
            className={selectedTab === "pending" ? "active" : ""}
          >
            Pending
          </button>
          <button
            onClick={() => setSelectedTab("moderate")}
            className={selectedTab === "moderate" ? "active" : ""}
          >
            Moderate
          </button>
        </div>

        {selectedTab === "active" ? (

          <ActiveCard startDate={startDate} endDate={endDate}  />
        ) : selectedTab === "pending" ? (
          <Cards startDate={startDate} endDate={endDate}  />
        ) : (
          <ModerateCard startDate={startDate} endDate={endDate} />
        )}
      </div>
    </>
  );
};

export default Projects;
