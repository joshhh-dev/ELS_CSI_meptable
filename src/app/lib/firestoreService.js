import {collection, getDocs} from "firebase/firestore";
import {db} from "./firebase";

export const fetchMachine = async () => {
    try {
    const querySnapshot = await getDocs(collection(db, "mep_washer"));
    const washers = querySnapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
    }));    
    return washers;

    } catch (error) {
        console.error("Error fetching data: ", error);
        return [];
    }
}

