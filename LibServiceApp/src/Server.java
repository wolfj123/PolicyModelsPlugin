import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class Server {


    public static void main(String[] args) {
        try {
            activeServer();
            System.out.print("ready");

        } catch (IOException e) {
            e.printStackTrace();
        }

    }

    public static void activeServer() throws IOException {
        ExecutorService executor =  Executors.newSingleThreadExecutor();
        HttpServer server = HttpServer.create(new InetSocketAddress("localhost", 5001), 0);
        server.createContext("/load", new LoadModelHandler());
        server.createContext("/loc/new", new CreateNewLocalizationhandler());
        server.createContext("/loc/update", new UpdateLocalizationHandler());
        server.createContext("/visualize-ps", new VisualizePSHandler());
        server.createContext("/visualize-dg", new VisualizeDGHandler());
        server.setExecutor(executor);
        server.start();
    }
}


