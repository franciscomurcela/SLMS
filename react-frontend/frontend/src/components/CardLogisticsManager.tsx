interface KPI {
  carrierName: string;
  totalDeliveryCost: number;
  totalDeliveryWeight: number;
  onTimeDeliveries: number;
  offTimeDeliveries: number;
  successDelivered: number;
  notDelivered: number;
}

function CardLogisticsManager({ pkg }: { pkg: KPI }) {
  return (
    <>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">
            <strong>Carrier Name: </strong>
            {pkg.carrierName}
          </h5>
          <h5 className="card-title">
            <strong>Average Cost: </strong>
            {(pkg.totalDeliveryCost / pkg.totalDeliveryWeight).toFixed(2)} €/Kg
          </h5>
          <p className="card-text">
            Total Cost: <strong>{pkg.totalDeliveryCost} €</strong>
            <br />
            Total Weight: <strong>{pkg.totalDeliveryWeight} Kg</strong>
          </p>
          <h5 className="card-title">
            <strong>On Time Rate: </strong>
            {(
              pkg.onTimeDeliveries /
              (pkg.onTimeDeliveries + pkg.offTimeDeliveries)
            ).toFixed(4)}
            %
          </h5>
          <p className="card-text">
            On Time Deliveries: <strong>{pkg.onTimeDeliveries}</strong>
            <br />
            Off Time Deliveries: <strong>{pkg.offTimeDeliveries}</strong>
            <br />
            Total Deliveries:{" "}
            <strong>{pkg.onTimeDeliveries + pkg.offTimeDeliveries}</strong>
          </p>
          <h5 className="card-title">
            <strong>Success Rating: </strong>
            {(
              pkg.successDelivered /
              (pkg.successDelivered + pkg.notDelivered)
            ).toFixed(2)}
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
    </>
  );
}

export default CardLogisticsManager;
