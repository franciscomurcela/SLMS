import Header from "./Header";

const role: string = "Tracking Portal";

function TrackingPortal() {
  return (
    <>
      <Header role={role} />
      <h4>Insira o código da sua encomenda</h4>
      <div className="input-group mb-3">
        <span className="input-group-text" id="basic-addon1">
          Tracking ID:
        </span>
        <input
          type="text"
          className="form-control"
          placeholder="ex. 123456789"
          aria-label="Username"
          aria-describedby="basic-addon1"
        ></input>
      </div>

      <div className="d-grid gap-2 col-6 mx-auto">
        <button className="btn btn-primary" type="button">
          Procurar
        </button>
      </div>
    </>
  );
}

export default TrackingPortal;
