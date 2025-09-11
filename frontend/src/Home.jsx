import React from "react";
import Header from "./Header";

const homeStyle = {
    backgroundImage: `url(/background.jpg)`,
    backgroundAttachment: "fixed", // face imaginea fixă
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    minHeight: "100vh", // ocupă tot ecranul
  };

function Home(){
    return(
        <div style={homeStyle}>
        <Header />
        
        </div>
    )
}
export default Home;