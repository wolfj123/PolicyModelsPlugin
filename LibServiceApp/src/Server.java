import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.json.simple.JSONArray;
import org.json.simple.JSONAware;
import org.json.simple.parser.JSONParser;
import org.parboiled.common.Tuple2;

import javax.swing.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.io.*;
import java.net.InetSocketAddress;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class Server {

    private static String tempAns;//TODO delete

    public static void main(String[] args) {
        if (args.length != 0 && args[0].equals("new")){
            handleNewModelData();
            System.exit(0);
        }

        try {
            activeServer();
            System.out.print("ready" +  ProcessHandle.current().pid());
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
        server.createContext("/newModel",new NewModelHandler());
        server.setExecutor(executor);
        server.start();
    }


    private static boolean waitingForUser;
    private static NewModelInputData modelData;

    private static void handleNewModelData(){
        waitingForUser = true;
        modelData = null;
        new Thread(() -> {
            openInputWindow();
        }).start();

        while (waitingForUser){
            try {
                Thread.sleep(200);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }

        String errorResponse = "res---Cancel---";

        if (modelData == null){
            System.out.println(errorResponse);
            return;
        }else{
            ObjectMapper mapper = new ObjectMapper();
            String ans = "";
            try {
                ans = mapper.writeValueAsString(modelData);
                tempAns = ans;
            } catch (JsonProcessingException e) {
                e.printStackTrace();
                System.out.println(errorResponse);
                return;
            }
            if (ans == null || ans.equals("")){
                System.out.println(errorResponse);
                return;
            }
            System.out.println("res---new---"+ans);
        }
    }

    private static void openInputWindow() {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (ClassNotFoundException | InstantiationException | IllegalAccessException | UnsupportedLookAndFeelException ex) {
            ex.printStackTrace();
        }

        JFrame frame = new JFrame("NewModelInputForm");
        NewModelInputForm inputForm = new NewModelInputForm();
        frame.setContentPane(inputForm.getMainPanel());
        frame.setDefaultCloseOperation(JFrame.HIDE_ON_CLOSE);

        frame.addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                modelData = inputForm.getAns();
                waitingForUser = false;
                super.windowClosing(e);
                frame.dispose();
            }
        });
        frame.pack();
        frame.setVisible(true);
        inputForm.init();
    }


}


