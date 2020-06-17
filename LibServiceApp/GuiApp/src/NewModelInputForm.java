import javax.swing.*;
import javax.swing.border.EtchedBorder;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import java.awt.*;
import java.awt.event.*;
import java.io.File;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

public class NewModelInputForm {
    private JTextField modelNameTextField;
    private JTextField modelPathTextField;
    private JTextField dgFileNameTextField;
    private JTextField psFileNameTextField;
    private JTextField rootSlotTextField;
    private JButton createNewModelButton;
    private JButton cancelButton;
    private JPanel mainPanel;
    private JPanel buttonsPanel;
    /// authors fields
    private JScrollPane scrollPane;
    private JButton addAuthorButton;
    private JButton removeAuthorButton;
    private JLabel authorAmountLabel;
    private JButton folderSelectorButton;
    private JPanel authorsContainerPanel; // panel inside scroll pane that holds all author info panel
    private List<NewAuthorInfoPanel> newAuthorInfoPanelList;

    private JFrame containingFrame;

    private String homeFolder;
    private String authorAmountFormat = "Current Authors: %s";

    private NewModelInputData ans;

    private void createUIComponents() {
        String modelNameHint = "Policy Model";
        homeFolder= System.getProperty("user.home");
        modelNameTextField = new HintTextField(modelNameHint);
        modelPathTextField = new HintTextField(Paths.get(homeFolder,modelNameHint).toString());
        dgFileNameTextField = new HintTextField("decision-graph.dg");
        psFileNameTextField = new HintTextField("policy-space.pspace");
        rootSlotTextField = new HintTextField("DataTags");
        authorAmountLabel = new JLabel(String.format(authorAmountFormat,1));

        authorsContainerPanel = new JPanel(); //Panel for all authors input
        authorsContainerPanel.setLayout(new BoxLayout(authorsContainerPanel,BoxLayout.Y_AXIS));
        authorsContainerPanel.setAlignmentX(Component.LEFT_ALIGNMENT);

        scrollPane = new JScrollPane(authorsContainerPanel);
        scrollPane.setAlignmentX(Component.LEFT_ALIGNMENT);
        scrollPane.getVerticalScrollBar().setUnitIncrement(10);

        this.newAuthorInfoPanelList = new LinkedList<>();
        newAuthorInfoPanelList.add(new NewAuthorInfoPanel());
        authorsContainerPanel.add(newAuthorInfoPanelList.get(0));

    }

    public JPanel getMainPanel() {
        return mainPanel;
    }


    public void init() {
        ans = null;
        this.containingFrame = (JFrame) getMainPanel().getRootPane().getParent();

        //sets the Author panel maximal height according to size after packing - this should set the maximal height according to frame size on each screen
        newAuthorInfoPanelList.get(0).setMaxHeight(newAuthorInfoPanelList.get(0).getHeight());
        addAuthorButton.addActionListener(e -> addAuthor());
        removeAuthorButton.addActionListener(e -> removeAuthor());
        cancelButton.addActionListener(e ->
                this.containingFrame.dispatchEvent(new WindowEvent(this.containingFrame, WindowEvent.WINDOW_CLOSING)) );
        createNewModelButton.addActionListener(e -> {
            collectAllData();
            this.containingFrame.dispatchEvent(new WindowEvent(this.containingFrame, WindowEvent.WINDOW_CLOSING));
        });

        // This updates the path text field according to the new model name if the path wasn't set by user
        modelNameTextField.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent e) {
                updatePath(e);
            }

            @Override
            public void removeUpdate(DocumentEvent e) {
                updatePath(e);
            }

            @Override
            public void changedUpdate(DocumentEvent e) {
                updatePath(e);
            }

            private void updatePath(DocumentEvent e){
                ((HintTextField)modelPathTextField).setHint(((HintTextField)modelNameTextField).getFinalValue());
            }
        });

        this.folderSelectorButton.setMargin(new Insets(2,1,2,2));
        this.folderSelectorButton.addActionListener(e -> {
            JFileChooser chooser = new JFileChooser();
            chooser.setCurrentDirectory(new File(homeFolder));
            chooser.setDialogTitle("Select Folder");
            chooser.setFileSelectionMode(JFileChooser.DIRECTORIES_ONLY);

            JFrame chooserFrame =  new JFrame();
            chooserFrame.setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);
            chooserFrame.setContentPane(chooser);
            chooserFrame.pack();

            int chooserRetVal = chooser.showOpenDialog(chooserFrame);
            if (chooserRetVal == JFileChooser.APPROVE_OPTION) {
                this.modelPathTextField.setText(chooser.getSelectedFile().getAbsolutePath());
            }
        });

        // We need this sleep in order to set the default focus to the correct button otherwise the frame focus will be set on some random textfield
        try {
            Thread.sleep(250);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        buttonsPanel.requestFocusInWindow();
        createNewModelButton.requestFocusInWindow();

    }

    /**
     * Adds all relevant textfields in order to add another author
     */
    private void addAuthor(){
        NewAuthorInfoPanel authorPanel = new NewAuthorInfoPanel();
        this.newAuthorInfoPanelList.add(authorPanel);
        this.authorsContainerPanel.add(authorPanel);
        this.authorAmountLabel.setText(String.format(authorAmountFormat,newAuthorInfoPanelList.size()));
        this.authorsContainerPanel.repaint();
    }

    /**
     * Removes textfields of the last author
     */
    private void removeAuthor(){
        if (this.newAuthorInfoPanelList.size() != 0){
            NewAuthorInfoPanel toRemove = this.newAuthorInfoPanelList.remove(newAuthorInfoPanelList.size() -1 );
            this.authorAmountLabel.setText(String.format(authorAmountFormat,newAuthorInfoPanelList.size()));
            this.authorsContainerPanel.remove(toRemove);

            this.authorsContainerPanel.repaint();

        }
    }


    private void collectAllData() {
        List<MyAuthorData> authorsData = new ArrayList<>(newAuthorInfoPanelList.size());

        for (NewAuthorInfoPanel authorInput : newAuthorInfoPanelList) {
            authorsData.add(new MyAuthorData(authorInput.isAuthorPerson(),
                    authorInput.getAuthorName(),
                    authorInput.getAuthorContact(),
                    authorInput.getAuthorAffiliation()));
        }

        ans = new NewModelInputData(
                ((HintTextField) modelNameTextField).getFinalValue(),
                ((HintTextField) modelPathTextField).getFinalValue(),
                ((HintTextField) dgFileNameTextField).getFinalValue(),
                ((HintTextField) psFileNameTextField).getFinalValue(),
                ((HintTextField) rootSlotTextField).getFinalValue(),
                authorsData
        );
    }

    public NewModelInputData getAns() {
        return ans;
    }


    public class HintTextField extends JTextField implements FocusListener {

        private String hint;
        private boolean showingHint;

        public HintTextField(String hint) {
            super(hint);
            this.hint = hint;
            this.showingHint = true;
            super.addFocusListener(this);
            this.setForeground(Color.gray);
        }


        @Override
        public void setText(String t) {
            super.setText(t);
            if (t != null && !t.equals("")) {
                this.showingHint = false;
                this.setForeground(Color.black);
            }else{
                this.showingHint = true;
                this.setForeground(Color.gray);
            }
        }

        @Override
        public void focusGained(FocusEvent e) {
            if(this.getText().isEmpty()) {
                super.setText("");
                showingHint = false;
                this.setForeground(Color.black);
            }
        }
        @Override
        public void focusLost(FocusEvent e) {
            if(this.getText().isEmpty()) {
                super.setText(hint);
                showingHint = true;
                this.setForeground(Color.gray);
            }
        }

        @Override
        public String getText() {
            return showingHint ? "" : super.getText();
        }

        /**
         * @return text in textField hint or user text whatever is currently set
         */
        public String getFinalValue(){
            return super.getText();
        }

        public void setHint(String newHint) {
            if (newHint.trim().equals("")){
                return;
            }
            this.hint = Paths.get(homeFolder,(newHint == null ? "": newHint.trim())).toString();
            if (this.showingHint) {
                this.setText(this.hint);
                this.showingHint = true;
                this.setForeground(Color.gray);
            }
        }
    }

    private static int authorInfoPanelMaxHeight = -1;


    /**
     * This class represents all the needed elements to create one author
     */
    public class NewAuthorInfoPanel extends JPanel {
        private JRadioButton personRB;
        private JRadioButton groupRB;

        private JTextField authorNameTextField;
        private JTextField authorAffiliationTextField;
        private JTextField authorContactTextField;


        private JPanel createGroupOrPersonPanel(){
            JLabel personOrGroupLabel = new JLabel("Person Or Group:");
//            personOrGroupLabel.setHorizontalAlignment(SwingConstants.LEFT);
            JPanel porPanel = new JPanel();
            porPanel.setLayout(new FlowLayout(FlowLayout.LEADING));
//            porPanel.setAlignmentX(Component.LEFT_ALIGNMENT);

            ButtonGroup porButtonGroup = new ButtonGroup();

            personRB = new JRadioButton("Person",true);
            groupRB = new JRadioButton("Group",false);
            porButtonGroup = new ButtonGroup();
            porButtonGroup.add(personRB);
            porButtonGroup.add(groupRB);

            porPanel.add(personOrGroupLabel);
            porPanel.add(personRB);
            porPanel.add(groupRB);

            return  porPanel;
        }

        private JPanel createAuthorNamePanel(){
            JLabel authorNameLabel = new JLabel("Author Name:   ");
            authorNameTextField = new JTextField();
//            authorNameTextField.setHorizontalAlignment();

            JPanel namePanel = new JPanel(new GridBagLayout());
            GridBagConstraints gbc = new GridBagConstraints();
            gbc.weightx = 1;
            gbc.fill = GridBagConstraints.HORIZONTAL;

            namePanel.add(authorNameLabel);
            namePanel.add(authorNameTextField,gbc);

            return namePanel;
        }

        private JPanel createContactPanel(){
            JLabel authorContactLabel = new JLabel("Author Contact:   ");
            authorContactTextField = new JTextField();
//            authorNameTextField.setHorizontalAlignment();

            JPanel contactPanel = new JPanel(new GridBagLayout());
            GridBagConstraints gbc = new GridBagConstraints();
            gbc.weightx = 1;
            gbc.fill = GridBagConstraints.HORIZONTAL;

            contactPanel.add(authorContactLabel);
            contactPanel.add(authorContactTextField,gbc);

            return contactPanel;
        }

        private JPanel createAuthorAffiliatinPanel(){
            JLabel authorAffiliationLabel = new JLabel("Author Affiliation:   ");
            authorAffiliationTextField = new JTextField();

            JPanel affiliationPanel = new JPanel(new GridBagLayout());
            GridBagConstraints gbc = new GridBagConstraints();
            gbc.weightx = 1;
            gbc.fill = GridBagConstraints.HORIZONTAL;

            affiliationPanel.add(authorAffiliationLabel);
            affiliationPanel.add(authorAffiliationTextField,gbc);

            return affiliationPanel;
        }

        public NewAuthorInfoPanel(){
            super(new GridLayout(0,1));
            this.setAlignmentY(TOP_ALIGNMENT);
            this.add(createGroupOrPersonPanel());
            this.add(createAuthorNamePanel());
            this.add(createAuthorAffiliatinPanel());
            this.add(createContactPanel());
            this.setBorder(BorderFactory.createEtchedBorder(EtchedBorder.LOWERED));
            if (authorInfoPanelMaxHeight != -1){
                this.setMaximumSize(new Dimension(Integer.MAX_VALUE,authorInfoPanelMaxHeight));
            }
//            this.setMaximumSize(new Dimension(Integer.MAX_VALUE,80));
//            authorNameLabel = new JLabel("Author Name:");
//            authorContactLabel = new JLabel("Author Contact:");
        }

        public void setMaxHeight(int maxHeight){
            if (authorInfoPanelMaxHeight == -1){
                authorInfoPanelMaxHeight = maxHeight + 10;
                this.setMaximumSize(new Dimension(Integer.MAX_VALUE,authorInfoPanelMaxHeight));
            }
        }

        public boolean isAuthorPerson(){
            return personRB.isSelected();
        }

        public String getAuthorName(){
            return authorNameTextField.getText();
        }

        public String getAuthorAffiliation(){
            return authorAffiliationTextField.getText();
        }
        public String getAuthorContact(){
            return authorContactTextField.getText();
        }

    }


}
