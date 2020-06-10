package CommandCustomize;

import edu.harvard.iq.policymodels.cli.CliRunner;
import edu.harvard.iq.policymodels.cli.commands.VisualizePolicySpaceCommand;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class VisualizePolicySpaceCommandCustomize extends VisualizePolicySpaceCommand {
    private static Path pathToDot;
    public boolean dotIsNotResolved = false;
    public boolean dotIsGlobal = false;
    public static Path publicPathToDot;

    public VisualizePolicySpaceCommandCustomize() {
        super();
    }

    //Overrides to avoid promote to user from the origin cli
    public void execute(CliRunner rnr, List<String> args) throws Exception {
        if (this.pathToDot == null) {
            Optional<Path> dotPath = this.findDot();
            if (!dotPath.isPresent()) {
                dotPath = this.parseDotPath(args.get(2));  // use passed dot path
            } else{
                dotIsGlobal = true; // in case the dot path is available as global variable
            }

            if (!dotPath.isPresent()) {
                rnr.printWarning("Could not find dot. You can install it from www.graphviz.org, or using your platform's package manager.");
                dotIsNotResolved = true;
                return;
            }

            pathToDot = (Path)dotPath.get();
        }

        if (!Files.exists(pathToDot, new LinkOption[0])) {
            rnr.printWarning("Dot does not exist in the supplied path `%s`", new Object[]{pathToDot});
            dotIsNotResolved = true;
            dotIsGlobal = false;
            pathToDot = null;
        }

        if (pathToDot != null) {
            this.executeWithDot(pathToDot, rnr, args);
            if(dotIsGlobal)
                publicPathToDot = pathToDot;
        } else {
            rnr.printWarning("Command cancelled");
        }

    }

    //needed because this has a private access in the DotCommand from origin cli
    Optional<Path> findDot() {
        String exec = "dot";
        return Stream.of(System.getenv("PATH").split(Pattern.quote(File.pathSeparator))).map((x$0) -> {
            return Paths.get(x$0);
        }).filter((path) -> {
            return Files.exists(path.resolve(exec), new LinkOption[0]);
        }).findFirst().map((p) -> {
            return p.resolve(exec);
        });
    }

    //instead of promote to user -> parse path that was given
    private Optional<Path> parseDotPath(String dotStr) throws IOException {
        return Optional.ofNullable(dotStr.isEmpty() ? null : Paths.get(dotStr));
    }

    //needed because this has a private access in the DotCommand from origin cli
    protected Path getOuputFilePath(CliRunner rnr, List<String> args, Path basePath, String extension) throws IOException {
        List<String> relevantArgs = (List)args.stream().filter((a) -> {
            return !a.startsWith("-");
        }).collect(Collectors.toList());
        Path outputPath;
        if (relevantArgs.size() < 2) {
            String dgFileName = basePath.getFileName().toString();
            int extensionStart = dgFileName.lastIndexOf(".");
            if (extensionStart > 0) {
                dgFileName = dgFileName.substring(0, extensionStart) + extension;
            }

            Path defaultOutput = basePath.resolveSibling(dgFileName + ".pdf");
            String outputPathFromUser = rnr.readLine("Enter output file name [%s]: ", new Object[]{defaultOutput});
            outputPath = outputPathFromUser.trim().isEmpty() ? defaultOutput : Paths.get(outputPathFromUser.trim());
        } else {
            outputPath = Paths.get((String)relevantArgs.get(1));
        }

        return outputPath;
    }

}
