import Header from "./Header";
import CarrierOptimization from "./CarrierOptimization";

const role: string = "Logistics Manager";

function LogisticsManager() {
  return (
    <>
      <Header role={role} href="/" />
      <div className="container-fluid">
        <CarrierOptimization />
      </div>
    </>
  );
}

export default LogisticsManager;
