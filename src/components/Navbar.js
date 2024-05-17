import "./Navbar.css";

function Navbar() {
  return (
    <>
      <nav className="navbar">
        <ul className="navbar-list">
          <li className="navbar-item">Home</li>
          <li className="navbar-item">AboutMe</li>
          <li className="navbar-item">Timeline</li>
          <li className="navbar-item">Projects</li>
          <li className="navbar-item">ContactMe</li>
        </ul>
      </nav>
    </>
  );
}

export default Navbar;
