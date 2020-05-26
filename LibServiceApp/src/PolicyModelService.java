import edu.harvard.iq.policymodels.cli.CliRunner;
import edu.harvard.iq.policymodels.cli.commands.*;
import org.parboiled.common.Tuple2;

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

    public static void updateLocalization() throws  Exception {
        UpdateLocalizationCommand updateCmd = new UpdateLocalizationCommand();
        updateCmd.execute(cli,new LinkedList<>());
    }

    public static Tuple2<Integer,String> createNewModel (CliRunnerNewModelOverride newCli) throws  Exception{

        NewModelCommand newModelCommand = new NewModelCommand();
        try {
            newModelCommand.execute(newCli, Collections.emptyList());
            if (newCli.getModel() != null) {
                if (newCli.getModelPath() != null) {
                    return new Tuple2<>(200, newCli.getModelPath());
                }
                String lastMessage = newCli.getLastMessage().replace("/!\\", "");
                return new Tuple2<>(511, (!lastMessage.equals("")) ? lastMessage : "Unknown Error");
            }
        }catch (Exception e){
            return new Tuple2<>(513,"CLI internal error");
        }
        return new Tuple2<>(512,"Unknown Error");
    }

}
