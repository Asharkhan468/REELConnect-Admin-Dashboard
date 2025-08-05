import React, { useState, useEffect } from "react";
import "./Login.css";
import { Link } from "react-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import Toast from "../Toast/Toast";
import { auth, db } from "../../firebaseConfig";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/reducer/userSlice";
import { collection, query, where, getDocs } from "firebase/firestore";

const LoginSec = () => {
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [toast, setToast] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Loading state

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  // Check if user was previously authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const rememberMeStatus = localStorage.getItem("rememberMe") === "true";
      const userData = localStorage.getItem("user");

      if (rememberMeStatus && userData) {
        try {
          // Check if user is still authenticated
          await new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
              unsubscribe();
              resolve(user);
            });
          });

          // Parse user data
          const parsedUserData = JSON.parse(userData);
          
          // Check if user is admin (as per your original logic)
          if (parsedUserData.email === "admin@reelConnect.com") {
            dispatch(setUser(parsedUserData));
            navigate("/userPage");
          }
        } catch (error) {
          console.log("Auto-login check failed:", error);
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [dispatch, navigate]);

  const handleChangeName = (e) => {
    setFullName(e.target.value);
  };

  const handleChangePassword = (e) => {
    setPassword(e.target.value);
  };

  const handleRememberMe = (e) => {
    setRememberMe(e.target.checked);
  };

  const onSubmit = async (data) => {
    if (data.email === "admin@reelConnect.com") {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          data.email,
          data.password
        );

        const user = userCredential.user;

        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("email", "==", data.email),
          where("role", "==", "admin")
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setToast({
            type: "error",
            message: "No admin user found in Firestore.",
          });
          return;
        }

        const adminData = querySnapshot.docs[0].data();

        dispatch(setUser(adminData));
        
        // Store only the rememberMe status and user data (without credentials)
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem("user", JSON.stringify(adminData));
        } else {
          localStorage.removeItem("rememberMe");
          localStorage.removeItem("user");
        }
          localStorage.setItem("user", JSON.stringify(adminData));

        setToast({ type: "success", message: "Login Successful!" });
        navigate("/userPage");
      } catch (error) {
        let errorMsg = "";

        switch (error.code) {
          case "auth/user-not-found":
            errorMsg = "User not found. Please check your email.";
            break;
          case "auth/wrong-password":
            errorMsg = "Incorrect password. Please try again.";
            break;
          case "auth/invalid-email":
            errorMsg = "Invalid email address format.";
            break;
          case "auth/user-disabled":
            errorMsg = "This account has been disabled.";
            break;
          case "auth/too-many-requests":
            errorMsg = "Too many failed attempts. Try again later.";
            break;
          case "auth/network-request-failed":
            errorMsg = "Network error. Please check your connection.";
            break;
          case "auth/internal-error":
            errorMsg = "Internal error occurred. Please try again.";
            break;
          default:
            errorMsg = "Login failed. Please try again.";
        }

        setToast({ type: "error", message: errorMsg });
      }
    } else {
      setToast({
        type: "error",
        message: "Access Denied! Only Admin can login.",
      });
    }

    setTimeout(() => setToast(null), 3000);
  };

  if (isCheckingAuth) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  return (
    <div>
      <>
        <div className="container">
          <div className="inner-container">
            <div className="welcome">
              <img src="/images/welcome.png" alt="" />
            </div>

            <div className="login">
              <div className="para">
                <h1>Welcome Back to REELConnect</h1>
                <p>Enter your login detail to continue your Filmaking jourey</p>
              </div>

              <div className="input-section">
                <div className="input-1">
                  <p>Email Address</p>
                  <input
                    {...register("email", { required: true })}
                    className="inputs"
                    type="text"
                    onChange={handleChangeName}
                    value={fullName}
                  />
                  {errors.email && (
                    <span className="required"> Email is required</span>
                  )}
                </div>

                <div className="input-2">
                  <p>Password</p>
                  <input
                    {...register("password", { required: true })}
                    className="inputs"
                    type="password"
                    onChange={handleChangePassword}
                    value={password}
                  />
                  {errors.password && (
                    <span className="required">Password is required</span>
                  )}

                  <div className="checkbox">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={handleRememberMe}
                    />
                    <span>Remember me</span>
                  </div>
                </div>

                <div className="login-btn">
                  <Link>
                    <button onClick={handleSubmit(onSubmit)}>Login</button>
                  </Link>
                </div>

                {toast && <Toast type={toast.type} message={toast.message} />}
              </div>
            </div>
          </div>
        </div>
      </>
    </div>
  );
};

export default LoginSec;