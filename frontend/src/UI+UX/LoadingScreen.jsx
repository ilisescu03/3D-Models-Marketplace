// LoadingScreen.jsx
import React from "react";
import { Mosaic } from "react-loading-indicators";

const containerStyle = {
  backgroundColor: "#fff",
  height: "100vh",
  width: "100vw",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
};

const logoStyle = {
  height: "160px",
  width: "160px",
  objectFit: "contain",
  marginBottom: "0px", 
};

function LoadingScreen() {
  return (
    <div style={containerStyle}>
     <Mosaic color="#ff9100ff" size="medium" text="" textColor="#f58800" />
    </div>
  );
}

export default React.memo(LoadingScreen);
