import edu.harvard.iq.policymodels.model.metadata.AuthorData;
import edu.harvard.iq.policymodels.model.metadata.GroupAuthorData;
import edu.harvard.iq.policymodels.model.metadata.PersonAuthorData;
import org.parboiled.common.Tuple3;

import javax.swing.*;
import javax.swing.border.EtchedBorder;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import java.awt.*;
import java.awt.event.*;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
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
    private JTextField authorNameTextField;
    private JTextField authorContactTextField;
    /// authors fields
    private JScrollPane scrollPane;
    private JButton addAuthorButton;
    private JButton removeAuthorButton;
    private JLabel authorAmountLabel;
    private JPanel authorsContainerPanel; // panel inside scroll pane that holds all author info panel
    private List<NewAuthorInfoPanel> newAuthorInfoPanelList;

    private JFrame frame;

    private String homeFolder;
    private String authorAmountFormat = "Current Authors: %s";

    private NewModelInputData ans;


//    public NewModelInputForm(JFrame frame) {
//        this.frame = frame;
//    }

    /**
     * TODO:
     * collect data to object and return
     * exit behavior button + close
     * ok button behavior
     */



    private void createUIComponents() {
        String modelNameHint = "Policy Model";
        homeFolder= System.getProperty("user.home");
        modelNameTextField = new HintTextField(modelNameHint);
        modelPathTextField = new HintTextField(Paths.get(homeFolder,modelNameHint).toString());
        dgFileNameTextField = new HintTextField("decision-graph.dg");
        psFileNameTextField = new HintTextField("policy-space.pspace");
        rootSlotTextField = new HintTextField("DataTags");
        authorNameTextField = new HintTextField("");
        authorContactTextField = new HintTextField("");
        authorAmountLabel = new JLabel(String.format(authorAmountFormat,1));

        authorsContainerPanel = new JPanel();
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
        this.frame = (JFrame) getMainPanel().getRootPane().getParent();

        newAuthorInfoPanelList.get(0).setMaxHeight(newAuthorInfoPanelList.get(0).getHeight());
        addAuthorButton.addActionListener(e -> addAuthor());
        removeAuthorButton.addActionListener(e -> removeAuthor());
        cancelButton.addActionListener(e -> this.frame.dispatchEvent(new WindowEvent(this.frame, WindowEvent.WINDOW_CLOSING)) );
        createNewModelButton.addActionListener(e -> {
            collectAllData();
            this.frame.dispatchEvent(new WindowEvent(this.frame, WindowEvent.WINDOW_CLOSING));
        });

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
    /*    modelNameTextField.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                System.out.println(e.toString());
                ((HintTextField)modelPathTextField).setHint(modelNameTextField.getText());
            }
        });
*/
        try {
            Thread.sleep(250);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        buttonsPanel.requestFocusInWindow();
        createNewModelButton.requestFocusInWindow();

    }

    private void addAuthor(){
        NewAuthorInfoPanel authorPanel = new NewAuthorInfoPanel();
        this.newAuthorInfoPanelList.add(authorPanel);
        this.authorsContainerPanel.add(authorPanel);
        this.authorAmountLabel.setText(String.format(authorAmountFormat,newAuthorInfoPanelList.size()));
        this.authorsContainerPanel.repaint();
    }

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

        public String getFinalValue(){
            return super.getText();
        }

        public void setHint(String newHint) {
            if (newHint.trim().equals("")){
                return;
            }
            this.hint = Paths.get(homeFolder,(newHint == null ? "": newHint.trim())).toString();
            if (this.showingHint){
                this.setText(this.hint);
            }
        }
    }

    private static int authorInfoPanelMaxHeight = -1;


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
