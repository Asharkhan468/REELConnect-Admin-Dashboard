import React from "react";
import { useLocation } from "react-router";
import CustomRoutes from "./CustomRoutes/CustomRoutes";
import SideBar from "./Component/SideBarSec/SideBar";
import Header from "./Component/HeaderSec/Header";
import "./App.css";

const App = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";
  const validPaths = [
  '/userPage',
  '/projectsPage',
  '/coursePage',
  '/supportPage',
  '/showcaseFilm',
  '/GroupChatPage',
  '/QuizAdd'
];

 const currentPath = location.pathname;

  const showHeaderAndSidebar = validPaths.includes(currentPath);


  return (
    <div className="main-container">
      <div className="app-container">
        <div>{!isLoginPage && showHeaderAndSidebar && <SideBar />}</div>
        <div>{!isLoginPage && showHeaderAndSidebar && <Header />}</div>
      </div>
      <div className="route">
        <CustomRoutes />
      </div>
    </div>
  );
};

export default App;
