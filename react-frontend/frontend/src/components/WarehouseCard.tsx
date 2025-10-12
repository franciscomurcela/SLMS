import { use, useState } from "react";

function WarehouseCard({ requestID }: { requestID: string }) {
  return (
    <>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">{requestID}</h5>
          <p className="card-text">
            Some quick example text to build on the card title and make up the
            bulk of the card’s content.
          </p>
          <a href="#" className="btn btn-primary">
            Go somewhere
          </a>
        </div>
      </div>
    </>
  );
}

export default WarehouseCard;