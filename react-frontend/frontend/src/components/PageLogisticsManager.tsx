import Header from "./Header";
import CardLogisticsManager from "./CardLogisticsManager";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";
import type { KPI } from "./KPI";
import { useState } from "react";

const role: string = Roles.ROLE_LOGISTICS_MANAGER;
const href: string = Paths.PATH_LOGISTICS_MANAGER;

const mockPackages: KPI[] = [
  {
    carrierName: "AeroShip Express",
    totalDeliveries: 503,
    averageCost: 14,
    onTimeDeliveries: 300,
    offTimeDeliveries: 203,
    successDelivered: 502,
    notDelivered: 1,
  },
  {
    carrierName: "BoltLine Logistics",
    totalDeliveries: 503,
    averageCost: 14,
    onTimeDeliveries: 100,
    offTimeDeliveries: 403,
    successDelivered: 502,
    notDelivered: 1,
  },
  {
    carrierName: "CargoSwift Solutions",
    totalDeliveries: 503,
    averageCost: 16.44,
    onTimeDeliveries: 300,
    offTimeDeliveries: 203,
    successDelivered: 502,
    notDelivered: 1,
  },
  {
    carrierName: "DashFreight Co.",
    totalDeliveries: 503,
    averageCost: 142,
    onTimeDeliveries: 300,
    offTimeDeliveries: 203,
    successDelivered: 503,
    notDelivered: 0,
  },
];

function LogisticsManager() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [sortBy, setSortBy] = useState<
    | "averageCostAsc"
    | "averageCostDesc"
    | "onTimeRatingAsc"
    | "onTimeRatingDesc"
    | "successRatingAsc"
    | "successRatingDesc"
  >("averageCostAsc");

  const handleSortChange = (
    newSortBy:
      | "averageCostAsc"
      | "averageCostDesc"
      | "onTimeRatingAsc"
      | "onTimeRatingDesc"
      | "successRatingAsc"
      | "successRatingDesc"
  ) => {
    setSortBy(newSortBy);
    setIsDropdownOpen(false);
  };

  const sortedCarriers = mockPackages.sort((a, b) => {
    if (sortBy === "averageCostAsc") {
      return a.averageCost - b.averageCost;
    } else if (sortBy === "averageCostDesc") {
      return b.averageCost - a.averageCost;
    } else if (sortBy === "onTimeRatingAsc") {
      const onTimeRatingA = a.onTimeDeliveries / a.totalDeliveries;
      const onTimeRatingB = b.onTimeDeliveries / b.totalDeliveries;
      return onTimeRatingA - onTimeRatingB;
    } else if (sortBy === "onTimeRatingDesc") {
      const onTimeRatingA = a.onTimeDeliveries / a.totalDeliveries;
      const onTimeRatingB = b.onTimeDeliveries / b.totalDeliveries;
      return onTimeRatingB - onTimeRatingA;
    } else if (sortBy === "successRatingAsc") {
      const successRatingA = a.successDelivered / a.totalDeliveries;
      const successRatingB = b.successDelivered / b.totalDeliveries;
      return successRatingA - successRatingB;
    } else {
      const successRatingA = a.successDelivered / a.totalDeliveries;
      const successRatingB = b.successDelivered / b.totalDeliveries;
      return successRatingB - successRatingA;
    }
  });

  return (
    <>
      <Header role={role} href={href} />

      <div className="container mt-4">
        <h2 className="text-center mb-4" style={{ color: "#2c3e50" }}>
          {Roles.ROLE_LOGISTICS_MANAGER} Overview
        </h2>
        <div className="row">
          <div className="col-12">
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="d-flex flex-row-reverse justify-content-center justify-content-md-end">
                  <div className="dropdown position-relative">
                    <button
                      className="btn btn-outline-secondary dropdown-toggle"
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      style={{ minWidth: "180px" }}
                    >
                      Ordenar por:{" "}
                      {sortBy === "averageCostAsc"
                        ? "Custo médio (Asc)"
                        : sortBy === "averageCostDesc"
                        ? "Custo médio (Desc)"
                        : sortBy === "onTimeRatingAsc"
                        ? "On Time Rating (Asc)"
                        : sortBy === "onTimeRatingDesc"
                        ? "On Time Rating (Desc)"
                        : sortBy === "successRatingAsc"
                        ? "Success Rating (Asc)"
                        : "Success Rating (Desc)"}
                    </button>
                    {isDropdownOpen && (
                      <ul
                        className="dropdown-menu show position-absolute"
                        style={{ top: "100%", left: 0, zIndex: 1000 }}
                      >
                        <li>
                          <button
                            className={`dropdown-item ${
                              sortBy === "averageCostAsc" ? "active" : ""
                            }`}
                            onClick={() => handleSortChange("averageCostAsc")}
                          >
                            Custo médio (Asc)
                          </button>
                        </li>
                        <li>
                          <button
                            className={`dropdown-item ${
                              sortBy === "averageCostDesc" ? "active" : ""
                            }`}
                            onClick={() => handleSortChange("averageCostDesc")}
                          >
                            Custo médio (Desc)
                          </button>
                        </li>
                        <li>
                          <button
                            className={`dropdown-item ${
                              sortBy === "onTimeRatingAsc" ? "active" : ""
                            }`}
                            onClick={() => handleSortChange("onTimeRatingAsc")}
                          >
                            On Time Rating (Asc)
                          </button>
                        </li>
                        <li>
                          <button
                            className={`dropdown-item ${
                              sortBy === "onTimeRatingDesc" ? "active" : ""
                            }`}
                            onClick={() => handleSortChange("onTimeRatingDesc")}
                          >
                            On Time Rating (Desc)
                          </button>
                        </li>
                        <li>
                          <button
                            className={`dropdown-item ${
                              sortBy === "successRatingAsc" ? "active" : ""
                            }`}
                            onClick={() => handleSortChange("successRatingAsc")}
                          >
                            Success Rating (Asc)
                          </button>
                        </li>
                        <li>
                          <button
                            className={`dropdown-item ${
                              sortBy === "successRatingDesc" ? "active" : ""
                            }`}
                            onClick={() =>
                              handleSortChange("successRatingDesc")
                            }
                          >
                            Success Rating (Desc)
                          </button>
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {sortedCarriers.map((pkg) => (
              <>
                <CardLogisticsManager pkg={pkg} />
                <br />
              </>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default LogisticsManager;
