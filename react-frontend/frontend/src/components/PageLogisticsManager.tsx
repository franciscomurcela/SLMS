import Header from "./Header";
import { Sidebar } from "react-pro-sidebar";
import CardLogisticsManager from "./CardLogisticsManager";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";
import { useState } from "react";
import map from "../assets/map.svg";

const role: string = Roles.ROLE_LOGISTICS_MANAGER;
const href: string = Paths.PATH_LOGISTICS_MANAGER;

interface KPI {
  carrierName: string;
  totalDeliveryCost: number;
  totalDeliveryWeight: number;
  onTimeDeliveries: number;
  offTimeDeliveries: number;
  successDelivered: number;
  notDelivered: number;
}

// Dados de exemplo - substitua por dados reais do backend
const mockPackages: KPI = {
  carrierName: "PKG001",
  totalDeliveryCost: 12345,
  totalDeliveryWeight: 765,
  onTimeDeliveries: 300,
  offTimeDeliveries: 543,
  successDelivered: 2324,
  notDelivered: 123123,
};

function LogisticsManager() {
  return (
    <>
      <Header role={role} href={Paths.PATH_DRIVER_CARGO_MANIFEST} />

      <div className="container mt-4">
        <div className="row">
          <div className="col-12">
            <h2 className="text-center mb-4" style={{ color: "#2c3e50" }}>
              Overview
            </h2>
            <CardLogisticsManager pkg={mockPackages} />
          </div>
        </div>
      </div>
    </>
  );
}

export default LogisticsManager;
