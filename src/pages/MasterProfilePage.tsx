import { useParams } from "react-router-dom";

export default function MasterProfilePage() {
  const { slug } = useParams();
  return <h1 className="p-6 text-2xl font-bold text-text">Майстер: {slug}</h1>;
}