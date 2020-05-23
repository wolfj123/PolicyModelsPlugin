import java.util.Map;
import edu.harvard.iq.policymodels.cli.CliRunner;
import edu.harvard.iq.policymodels.cli.commands.NewModelCommand;
import org.parboiled.common.Tuple2;

public class NewModelHandler extends PolicyModelHttpHandler {

    @Override
    public String handleGetRequest(Map<String, String> params) throws Exception {
        return null;
    }

    @Override
    public Tuple2<Integer,String> handlePostRequest(String body) {
        CliRunnerNewModelOverride cli = new CliRunnerNewModelOverride(body);
        try {
            return PolicyModelService.createNewModel(cli);
        }catch (Exception ex){
            return  new Tuple2<>(500, "Unknown Error");
        }
    }
}
