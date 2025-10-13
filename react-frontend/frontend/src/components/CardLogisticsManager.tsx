import type { KPI } from "./KPI.tsx";

function CardLogisticsManager({ pkg }: { pkg: KPI }) {
  return (
    <>
      <div className="card">
        <div className="card-body">
          <div className="container text-center">
            <div className="row align-items-center">
              <div className="col">
                <h5 className="card-title">
                  <strong>Carrier Name: </strong>
                  {pkg.carrierName}
                </h5>
                <h5 className="card-title">
                  <strong>Total Deliveries: </strong>
                  <strong>{pkg.totalDeliveries}</strong>
                </h5>
              </div>
              <div className="col">
                <h5 className="card-title">
                  <strong>Average Cost: </strong>
                  {pkg.averageCost.toFixed(2)} €/Kg
                </h5>
              </div>

              <div className="col">
                <h5 className="card-title">
                  <strong>On Time Rate: </strong>
                  {((pkg.onTimeDeliveries / pkg.totalDeliveries) * 100).toFixed(
                    2
                  )}
                  %
                </h5>

                <p className="card-text">
                  On Time Deliveries: <strong>{pkg.onTimeDeliveries}</strong>
                  <br />
                  Off Time Deliveries: <strong>{pkg.offTimeDeliveries}</strong>
                </p>
              </div>
              <div className="col">
                {" "}
                <h5 className="card-title">
                  <strong>Success Rating: </strong>
                  {((pkg.successDelivered / pkg.totalDeliveries) * 100).toFixed(
                    2
                  )}
                  %
                </h5>
                <p className="card-text">
                  Successful Deliveries: <strong>{pkg.successDelivered}</strong>
                  <br />
                  Unsuccessful Deliveries: <strong>{pkg.notDelivered}</strong>
                  <br />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CardLogisticsManager;
