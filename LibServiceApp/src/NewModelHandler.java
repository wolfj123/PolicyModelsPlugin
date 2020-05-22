import java.util.Map;
import edu.harvard.iq.policymodels.cli.CliRunner;
import edu.harvard.iq.policymodels.cli.commands.NewModelCommand;

public class NewModelHandler extends PolicyModelHttpHandler {

    @Override
    public String handleGetRequest(Map<String, String> params) throws Exception {
        return null;
    }

    @Override
    public String handlePostRequest(String body) {
        try {
            CliRunnerNewModelOverride cli = new CliRunnerNewModelOverride(body);
            return PolicyModelService.createNewModel(cli);
        }catch (Exception ex){
            return "Fail";
        }
    }
}
