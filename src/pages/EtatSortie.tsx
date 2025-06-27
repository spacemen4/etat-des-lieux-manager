
import { useParams } from 'react-router-dom';
import EtatSortieForm from '@/components/EtatSortieForm';

const EtatSortie = () => {
  const { id } = useParams();
  
  return <EtatSortieForm />;
};

export default EtatSortie;
