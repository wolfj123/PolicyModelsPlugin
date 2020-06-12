import CommandCustomize.VisualizeDecisionGraphCommandCustomize;
import CommandCustomize.VisualizePolicySpaceCommandCustomize;
import edu.harvard.iq.policymodels.cli.CliRunner;
import edu.harvard.iq.policymodels.cli.commands.*;

import java.util.Collections;

import java.util.LinkedList;
import java.util.List;
import java.util.Set;

public  class PolicyModelService {
    static CliRunner cli = new CliRunner();;

    public static String loadPolicyModel(String path) throws Exception {
        LoadPolicyModelCommand loadCmd = new LoadPolicyModelCommand();
        List<String> args = new LinkedList<>();
        args.add(path);
        args.add(path);
        loadCmd.execute(cli, args);
        Boolean isSucceed = cli.getModel() != null;
        return isSucceed.toString();
    }

    public static String createNewLocalization(String name) throws Exception {
        CreateLocalizationCommand newLocCmd = new CreateLocalizationCommand();
        List<String> args = new LinkedList<>();
        args.add(name);
        args.add(name);
        newLocCmd.execute(cli,args);
        ReloadModelCommand reloadCmd = new ReloadModelCommand();
        reloadCmd.execute(cli,new LinkedList<>());
        Set<String> localizations = cli.getModel().getLocalizations();
        Boolean isSucceed = localizations.size() >0;
        return isSucceed.toString();
    }

    public static String updateLocalization() throws  Exception {
        CliRunnerUpdateLocalizationOverride overrideCli = new CliRunnerUpdateLocalizationOverride();
        if(loadPolicyIntoNewCli(overrideCli)){
            UpdateLocalizationCommand updateCmd = new UpdateLocalizationCommand();
            updateCmd.execute(overrideCli,new LinkedList<>());
            String answersToRemove = overrideCli.answersToRemove;
            if(answersToRemove != null){
                return answersToRemove;
            }
        }
        return "false";
    }

    private static Boolean loadPolicyIntoNewCli(CliRunner overrideCli) throws Exception {
        String path = cli.getModel().getDirectory().toString();
        LoadPolicyModelCommand loadCmd = new LoadPolicyModelCommand();
        List<String> args = new LinkedList<>();
        args.add(path);
        args.add(path);
        loadCmd.execute(overrideCli, args);
        return  overrideCli.getModel() != null;
    }

    public static Pair<Integer,String> createNewModel (CliRunnerNewModelOverride newCli) throws  Exception{
        NewModelCommand newModelCommand = new NewModelCommand();
        try {
            newModelCommand.execute(newCli, Collections.emptyList());
            if (newCli.getModel() != null) {
                if (newCli.getModelPath() != null) {
                    return new Pair<>(200, newCli.getModelPath());
                }
                String lastMessage = newCli.getLastMessage().replace("/!\\", "");
                return new Pair<>(511, (!lastMessage.equals("")) ? lastMessage : "Unknown Error");
            }
        }catch (Exception e){
            return new Pair<>(513,"CLI internal error");
        }
        return new Pair<>(512,"Unknown Error");
    }

    public static String visualizePS(String outputPath, String dotPath) throws  Exception {
        VisualizePolicySpaceCommandCustomize visualizePolicySpaceCmd = new VisualizePolicySpaceCommandCustomize();
        LinkedList<String> args = new LinkedList<>();
        args.add(outputPath);
        args.add(outputPath);
        args.add(dotPath);
        try {
            visualizePolicySpaceCmd.execute(cli, args);
            if (visualizePolicySpaceCmd.dotIsNotResolved)
                return "bad dot";
            else if(visualizePolicySpaceCmd.dotIsGlobal)
                return "global " + visualizePolicySpaceCmd.publicPathToDot;
            return "true";
        } catch (Exception ex){
            return "false";
        }
    }

    public static String visualizeDG(String outputPath, String dotPath) throws  Exception {
        VisualizeDecisionGraphCommandCustomize visualizeDecisionGraphCmd = new VisualizeDecisionGraphCommandCustomize();
        List<String> args = new LinkedList<>();
        args.add(outputPath);
        args.add(outputPath);
        args.add(dotPath);
        try {
            visualizeDecisionGraphCmd.execute(cli, args);
            if (visualizeDecisionGraphCmd.dotIsNotResolved)
                return "bad dot";
            else if(visualizeDecisionGraphCmd.dotIsGlobal)
                return "global " + visualizeDecisionGraphCmd.publicPathToDot;
            return "true";
        } catch (Exception ex){
            return "false";
        }
    }

}
