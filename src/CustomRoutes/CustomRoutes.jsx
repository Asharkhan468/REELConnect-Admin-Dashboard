import React from "react";
import { Route, Routes } from "react-router";
import LoginPage from "../Pages/LoginPage/LoginPage";
import UserPage from "../Pages/UserPage/UserPage";
import ProjectsPage from "../Pages/ProjectsPage/ProjectsPage";
import CoursePage from "../Pages/CoursePage/CoursePage";
import SupportPage from "../Pages/SupportPage/SupportPage";
import ShowCaseFilm from "../Component/ProjectsSec/ShowCaseFilm";
import ProtectRoutes from "../ProtectedRoutes";
import GroupChat from "../Component/GroupChat/GroupChat";
import QuizManagement from "../Component/CourseSec/Quiz";
import NotFound from "../Pages/NotFound/NotFound";

const CustomRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/userPage"
          element={<ProtectRoutes component={<UserPage />} />}
        />
        <Route
          path="/projectsPage"
          element={<ProtectRoutes component={<ProjectsPage />} />}
        />
        <Route
          path="/coursePage"
          element={<ProtectRoutes component={<CoursePage />} />}
        />
        <Route
          path="/supportPage"
          element={<ProtectRoutes component={<SupportPage />} />}
        />
        <Route
          path="/showcaseFilm"
          element={<ProtectRoutes component={<ShowCaseFilm />} />}
        />
        <Route
          path="/GroupChatPage"
          element={<ProtectRoutes component={<GroupChat />} />}
        />

        <Route path="/QuizAdd" element={<ProtectRoutes component={<QuizManagement />} />}/>

          <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default CustomRoutes;
