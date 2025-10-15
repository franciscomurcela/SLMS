import Header from "./Header";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";
import OrdersPanel from "./OrdersPanel";

const role: string = Roles.ROLE_WAREHOUSE;
const href: string = Paths.PATH_WAREHOUSE;

function Warehouse() {
  return (
    <>
      <Header role={role} href={href} />
      <main className="flex-grow-1 p-4" style={{ backgroundColor: "#f8f9fa" }}>
        <div className="container-fluid">
          <div className="row mb-4">
            <div className="col">
              <h2 className="mb-0">
                <i className="bi bi-building me-2 text-primary"></i>
                  Warehouse - Gestão de Pedidos
                </h2>
                <p className="text-muted">Visualize e gerencie os pedidos recebidos</p>
              </div>
            </div>

            <div className="row">
              <div className="col-12">
                <OrdersPanel />
              </div>
            </div>
          </div>
        </main>
    </>
  );
}

export default Warehouse;
