import {useEffect} from "react";
import Header from "../UI+UX/Header";
import { useAuth } from '/backend/contexts/authContext/index.jsx';
import CookiesBanner from '../UI+UX/CookiesBanner';
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
    const { currentUser, userLogedIn } = useAuth();
     useEffect(() => {
        console.log("=== HOME PAGE AUTH STATE ===");
        console.log("currentUser:", currentUser);
        console.log("userLogedIn:", userLogedIn);
    }, [currentUser, userLogedIn]);
    return(
        <div style={backgroundStyle}>
        <Header />
        <CookiesBanner/>
        
        </div>
    )
}
export default Home;