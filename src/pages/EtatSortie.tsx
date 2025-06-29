
import { useParams } from 'react-router-dom';
import EtatSortieForm from '@/components/EtatSortieForm';

const EtatSortie = () => {
  const { id } = useParams();
  
  if (!id) {
    return <div>ID de l'état des lieux manquant</div>;
  }
  
  return <EtatSortieForm etatId={id} />;
};

export default EtatSortie;
