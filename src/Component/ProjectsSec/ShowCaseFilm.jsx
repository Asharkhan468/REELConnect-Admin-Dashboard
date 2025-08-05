import "./Project.css";
import { useSelector } from "react-redux";
import FilmCard from "./FlimCard";

const ShowCaseFilm = () => {
  const user = useSelector((state) => state.user.currentUser);

  return (
    <>
      
        <FilmCard />
      
    </>
  );
};

export default ShowCaseFilm;
