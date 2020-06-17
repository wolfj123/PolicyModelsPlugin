import com.sun.net.httpserver.HttpServer;
import java.io.*;
import java.net.InetSocketAddress;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;



/**
 * The LibServiceApp is a server app, that used as a service for the
 * PolicyModels.jar CLI operation.
 * This application use the PolkicyModels.jar as a external library and call the relevant cli command,
 * to satisfy the clients requests.
 *
 * The Server class is the entry point of the application.
 * This class open a HTTP based server with a ephemeral port, and start listining
 * to client request, based on REAST-api.
 *
 */

public class Server {

    public static void main(String[] args) {
        try {
            int portNum = activeServer();
            System.out.print("ready -port:"+portNum);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static int activeServer() throws IOException {
        ExecutorService executor =  Executors.newSingleThreadExecutor();
        InetSocketAddress socket =  new InetSocketAddress("localhost", 0);
        HttpServer server = HttpServer.create();
        server.bind(socket,0);
        server.createContext("/load", new LoadModelHandler());
        server.createContext("/loc/new", new CreateNewLocalizationhandler());
        server.createContext("/loc/update", new UpdateLocalizationHandler());
        server.createContext("/newModel",new NewModelHandler());
        server.createContext("/visualize-ps", new VisualizePSHandler());
        server.createContext("/visualize-dg", new VisualizeDGHandler());
        server.setExecutor(executor);
        server.start();
        return server.getAddress().getPort();
    }



}


