import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import UploadComponent from "./components/UploadComponent";

function App() {
  return (
    <>
      <div className="h-screen flex flex-col justify-between bg-blue-50">
        <Navbar />
        <UploadComponent />
        <Footer />
      </div>
    </>
  );
}

export default App;
