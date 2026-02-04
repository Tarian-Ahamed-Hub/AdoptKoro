import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "../Configs/AxiosConfig";
import { toast, ToastContainer } from "react-toastify";

const FilterContext = createContext(null);


export default function FilterProvider({children}) {

 const [categories,setCategories] = useState([]);
  const [districts,setDistricts] = useState([]);
 const [loading,setLoading] = useState(true);
 const [currentDistrict,setCurrentDistrict] = useState({
            district: "Dhaka",
            latitude: 23.7115,
            longitude: 90.4111,
        });

  const [currentCategory,setCurrentCategory] = useState(  {
            name: "Cat",
        });

 const navigate = useNavigate();

 const getFilters = async()=>{
   
    try{
        const res =  await axios.get( "/api/post/public/catsAndDistricts");
        setCategories(res.data.categories);
        setDistricts(res.data.districts);
    }
    catch(err){
       console.log(err.message)
    }
    finally{
        setLoading(false)
    }
 }

 

   useEffect(() => {
      getFilters();
   
  }, []);



  return (
    <FilterContext.Provider value={{categories,districts,currentDistrict,currentCategory,setCurrentDistrict,setCurrentCategory}}>
      
        {children}
    </FilterContext.Provider>
  )
}

export const useFilters = () => useContext(FilterContext);
