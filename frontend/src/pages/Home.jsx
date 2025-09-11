import React from "react";
import Header from "../UI+UX/Header";

const backgroundStyle = {
    backgroundImage: `url(/background.jpg)`,
    backgroundAttachment: "fixed",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    minHeight: "100vh",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center', // center vertical
};

function Home(){
    return(
        <div style={backgroundStyle}>
        <Header />
        
        </div>
    )
}
export default Home;