import edu.harvard.iq.policymodels.cli.CliRunner;
import edu.harvard.iq.policymodels.cli.commands.*;

import java.lang.reflect.Field;
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

    public static void updateLocalization() throws  Exception {
        UpdateLocalizationCommand updateCmd = new UpdateLocalizationCommand();
        updateCmd.execute(cli,new LinkedList<>());
    }

    public static void visualizePS(String outputPath) throws  Exception {
        Class<?> visualizePolicySpaceCommandClass = VisualizePolicySpaceCommand.class;
        Object visualizePolicySpaceCommandReflection = visualizePolicySpaceCommandClass.newInstance();
        graphvizCommandExecute(outputPath, visualizePolicySpaceCommandReflection);
    }

    public static void visualizeDG(String outputPath) throws  Exception {
        Class<?> visualizeDecisionGraphCommandClass = VisualizeDecisionGraphCommand.class;
        Object visualizePolicySpaceCommandReflection = visualizeDecisionGraphCommandClass.newInstance();
        graphvizCommandExecute(outputPath, visualizePolicySpaceCommandReflection);
    }

    private static void graphvizCommandExecute(String outputPath, Object graphvizCommandReflection) throws  Exception{
        String pathToDot = "C:\\Program Files (x86)\\Graphviz2.38\\bin\\dot.exe"; //TODO change to get from client
        Field pathToDotField = graphvizCommandReflection.getClass().getSuperclass().getDeclaredField("pathToDot");
        pathToDotField.setAccessible(true);
        pathToDotField.set(graphvizCommandReflection, pathToDot);

        List<String> args = new LinkedList<>();
        args.add(outputPath);
        args.add(outputPath);
        ((DotCommand)graphvizCommandReflection).execute(cli, args);
    }

}
