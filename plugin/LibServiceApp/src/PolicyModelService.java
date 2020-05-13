

import edu.harvard.iq.policymodels.cli.CliRunner;
import edu.harvard.iq.policymodels.cli.commands.CreateLocalizationCommand;
import edu.harvard.iq.policymodels.cli.commands.LoadPolicyModelCommand;
import edu.harvard.iq.policymodels.cli.commands.UpdateLocalizationCommand;

import java.util.LinkedList;
import java.util.List;

public  class PolicyModelService {
    static CliRunner cli = new CliRunner();;

    public static void loadPolicyModel(String path) throws Exception {
        LoadPolicyModelCommand command = new LoadPolicyModelCommand();
        List<String> args = new LinkedList<>();
        args.add(path);
        args.add(path);
        command.execute(cli, args);
    }

    public static void createNewLocalization(String name) throws Exception {
        CreateLocalizationCommand command = new CreateLocalizationCommand();
        List<String> args = new LinkedList<>();
        args.add(name);
        args.add(name);
        command.execute(cli,args);
    }

    public static void updateLocalization() throws  Exception {
        UpdateLocalizationCommand command = new UpdateLocalizationCommand();
        command.execute(cli,new LinkedList<>());
    }

}
