import React from "react";
import { Outlet, Navigate } from "react-router-dom";
const AuthLayout = () => {
  const isAuthenticated = false;

  return (
    <div className="flex h-screen w-full">
      {isAuthenticated ? (
        <Navigate to="/" />
      ) : (
        <>
          <section className="flex flex-1 flex-center  py-10">
            <Outlet />
          </section>
          <img src="./public/side.png" alt="logo" className="hidden xl:block h-screen w-1/2 object-cover  bg-no-repeat" />
        </>
      )}
    </div>
  );
};

export default AuthLayout;
