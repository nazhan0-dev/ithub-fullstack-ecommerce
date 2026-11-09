import { useNavigate } from "react-router-dom";
import ContentCarousel from "../components/home/ContentCarousel";
import BestSeller from "../components/home/BestSeller";
import NewProduct from "../components/home/NewProduct";
import CategoryChips from "../components/home/CategoryChips";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      <ContentCarousel />

      <CategoryChips
        onToggle={(id) => navigate(`/shop?category=${id}`)}
        onClear={() => navigate("/shop")}
      />

      <BestSeller />
      <NewProduct />
    </div>
  );
};

export default Home;
