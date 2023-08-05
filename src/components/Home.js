import "./Home.css";
import Image from '../public/prof-removebg-preview (1).png';
function Home() {
  return (
    <>
      <div className="Home">
        <ul className="Home-about">
          <li>
            <h2>Hello,
            Hanshal here.
            </h2>
            <p>
              I'm a software developer. I'm currently interested in DevOps and
              Open-Source Projects. My journey till now has been reakky great, exciting and joyfull. I love programming.
            </p>
          </li>
          <li>
            <div className="img">
            <img src={Image} />
            </div>
          </li>
        </ul>
      </div>
    </>
  );
}

export default Home;
