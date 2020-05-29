import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import javax.swing.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;

public class Main {
    public static void main (String[]args){
        startNewModelGui();
    }



    private static boolean waitingForUser;
    private static NewModelInputData modelData;

    private static void startNewModelGui(){
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
