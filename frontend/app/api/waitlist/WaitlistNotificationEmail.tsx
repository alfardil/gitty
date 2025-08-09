import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WaitlistNotificationEmailProps {
  email: string;
}

const logoUrl =
  process.env.NODE_ENV === "production"
    ? "https://devboard.ai/gittylogo.png"
    : "http://localhost:3000/gittylogo.png";

export const WaitlistNotificationEmail = ({
  email,
}: WaitlistNotificationEmailProps) => (
  <Html>
    <Head />
    <Body style={main}>
      <Preview>New waitlist signup: {email}</Preview>
      <Container style={container}>
        <Img src={logoUrl} width="120" height="120" alt="Gitty" style={logo} />
        <Text style={title}>New Waitlist Signup</Text>
        <Text style={paragraph}>Someone just joined the Gitty waitlist!</Text>
        <Section style={emailContainer}>
          <Text style={emailText}>
            <strong>Email:</strong> {email}
          </Text>
        </Section>
        <Text style={paragraph}>
          This user is now on the waitlist and will be notified when Gitty
          launches.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Gitty - AI-powered code analysis and insights
        </Text>
      </Container>
    </Body>
  </Html>
);

WaitlistNotificationEmail.PreviewProps = {
  email: "user@example.com",
} as WaitlistNotificationEmailProps;

export default WaitlistNotificationEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "600px",
};

const logo = {
  margin: "0 auto",
  display: "block",
};

const title = {
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
  color: "#1a1a1a",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#4a4a4a",
  textAlign: "center" as const,
  marginBottom: "20px",
};

const emailContainer = {
  backgroundColor: "#f8f9fa",
  padding: "20px",
  borderRadius: "8px",
  textAlign: "center" as const,
  margin: "20px 0",
};

const emailText = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#2a2a2a",
  margin: "0",
};

const hr = {
  borderColor: "#e1e5e9",
  margin: "30px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  textAlign: "center" as const,
};
