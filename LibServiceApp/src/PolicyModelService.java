import edu.harvard.iq.policymodels.cli.CliRunner;
import edu.harvard.iq.policymodels.cli.commands.CreateLocalizationCommand;
import edu.harvard.iq.policymodels.cli.commands.LoadPolicyModelCommand;
import edu.harvard.iq.policymodels.cli.commands.ReloadModelCommand;
import edu.harvard.iq.policymodels.cli.commands.UpdateLocalizationCommand;
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

}
