import React, { useEffect, useState } from "react";
import { auth } from "././firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router";

function ProtectRoutes({ component }) {
  let [isUser, setIsUser] = useState(false);

  //use Navigate

  const navigate = useNavigate();

  useEffect(() => {
    onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          setIsUser(true);

          return;
        } else {
          navigate("/");
        }
      },
      []
    );
  });

  return <>{setIsUser ? component : <h1>loading...</h1>}</>;
}

export default ProtectRoutes;
