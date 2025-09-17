"use client";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { toast } from "react-toastify";

const collections = {
  mep_washer: "washer",
  mep_dryers: "dryer",
  mep_ironers: "ironer",
};

export default function SearchBar() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addToCart } = useCart();

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      let allResults = [];

      // ✅ Loop through object keys
      for (const colKey of Object.keys(collections)) {
        const querySnapshot = await getDocs(collection(db, colKey));
        querySnapshot.forEach((docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data(), collection: colKey };
          if (data.model?.toLowerCase().includes(search.toLowerCase())) {
            allResults.push(data);
          }
        });
      }

      setResults(allResults);
      setLoading(false);
    };

    fetchData();
  }, [search]);

  const handleClick = (item) => {
    // ✅ Map Firestore collection → local folder path
    const mappedCollection = collections[item.collection] || item.collection;
    const path = `/machines/${mappedCollection}/${encodeURIComponent(item.id)}`;
    router.push(path);
    router.refresh();
    setSearch("");
    setResults([]);
  };

  return (
    <div className="relative w-full max-w-md mx-auto mt-4">
      <input
        type="text"
        placeholder="Search machines..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 border rounded-md"
      />

      {search && results.length > 0 &&(
        <div className="absolute top-full left-0 right-0 bg-white border rounded-md mt-1 max-h-60 overflow-y-auto z-10 shadow-lg">
          {loading && <p className="p-2 text-gray-500 text-sm">Loading...</p>}

          {!loading && results.length === 0 && (
            <p className="p-2 text-gray-500 text-sm">No results found.</p>
          )}

          {results.map((item) => (
            <div
              key={item.id}
              className="p-3 border-b last:border-none hover:bg-gray-100 cursor-pointer transition"
              onClick={() => handleClick(item)}
            >
            <button 
              className="bg-green-500 text-white px-2 py-1 rounded text-sm"
              onClick={(e) => {
            e.stopPropagation();
            addToCart(item);
            toast.success(`✅ Added ${item.model} to cart`)
          }}
            >
              + Add
            </button>
              
              <h2 className="font-bold">{item.model}</h2>
              <p className="text-sm">Capacity: {item.capacity}</p>
              <p className="text-sm">Heat: {item.heatSource}</p>
              <p className="text-xs text-gray-500">
                From: {item.collection.replace("mep_", "").toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
